import { supabase } from './supabase';

export interface TherapistOnboardingInput {
  wallet_address: string;
  full_name: string;
  bio?: string;
  qualifications?: string[]; // [qualification, university]
  license_number: string;
  years_of_experience?: number;
  therapy_styles?: string[];
  languages_spoken?: string[];
  specialisation?: string[]; // Match your Supabase column name
  price_per_session?: string; // store as string to match existing interface
}

export interface UploadedDocument {
  path: string;
  publicUrl: string | null;
}

const VERIFICATION_BUCKET = 'therapist_verifications';

export async function uploadVerificationDocuments(
  walletAddress: string,
  files: File[]
): Promise<UploadedDocument[]> {
  const uploads: UploadedDocument[] = [];
  for (const file of files) {
    if (!file) continue;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `${walletAddress}/${Date.now()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .upload(objectPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload verification document:', uploadError.message);
      continue;
    }

    const { data: publicData } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .getPublicUrl(objectPath);

    uploads.push({ path: objectPath, publicUrl: publicData?.publicUrl ?? null });
  }
  return uploads;
}

export async function upsertTherapistByWallet(
  input: TherapistOnboardingInput,
  documentUrls: string[]
): Promise<{ success: boolean; error?: string; therapist_id?: string }> {
  const buildTherapistPayload = () => ({
    wallet_address: input.wallet_address,
    full_name: input.full_name,
    bio: input.bio ?? null,
    qualifications: input.qualifications ?? [],
    license_number: input.license_number,
    years_of_experience: input.years_of_experience ?? null,
    therapy_styles: input.therapy_styles ?? [],
    languages_spoken: input.languages_spoken ?? [],
    price_per_session: input.price_per_session ?? null,
    is_verified: false,
  });
  // If wallet_address is not UNIQUE in DB, UPSERT with onConflict will fail.
  // Do a safe check-then-update/insert to avoid requiring a unique constraint.
  const { data: existingRows, error: selectError } = await supabase
    .from('therapists')
    .select('id')
    .eq('wallet_address', input.wallet_address)
    .limit(1);

  if (selectError) {
    console.error('Error checking existing therapist:', selectError);
    return { success: false, error: selectError.message };
  }

  const existingId = existingRows && existingRows.length > 0 ? existingRows[0].id : null;

  if (existingId) {
    // Update existing therapist
    const { error: updateError } = await supabase
      .from('therapists')
      .update(buildTherapistPayload())
      .eq('id', existingId);

    if (updateError) {
      console.error('Error updating therapist:', updateError);
      return { success: false, error: updateError.message };
    }

    // Update specializations in separate table
    if (input.specialisation && input.specialisation.length > 0) {
      // First get the specialization IDs from the specializations table
      const { data: specializationData, error: specLookupError } = await supabase
        .from('specializations')
        .select('id, name')
        .in('name', input.specialisation);

      if (specLookupError) {
        console.warn('Could not lookup specialization IDs:', specLookupError.message);
      } else if (specializationData) {
        // Delete existing specializations for this therapist
        await supabase
          .from('therapist_specializations')
          .delete()
          .eq('therapist_id', existingId);

        // Insert new specializations using the junction table
        const specializationInserts = specializationData.map(spec => ({
          therapist_id: existingId,
          specialization_id: spec.id
        }));

        const { error: specError } = await supabase
          .from('therapist_specializations')
          .insert(specializationInserts);

        if (specError) {
          console.warn('Could not save specializations:', specError.message);
        }
      }
    }
  } else {
    // Insert new therapist
    const { error: insertError } = await supabase
      .from('therapists')
      .insert(buildTherapistPayload());

    if (insertError) {
      console.error('Error inserting therapist:', insertError);
      return { success: false, error: insertError.message };
    }

    // Get the newly inserted therapist ID
    const { data: newTherapist, error: getIdError } = await supabase
      .from('therapists')
      .select('id')
      .eq('wallet_address', input.wallet_address)
      .single();

    if (getIdError) {
      console.warn('Could not get new therapist ID:', getIdError.message);
    } else if (newTherapist && input.specialisation && input.specialisation.length > 0) {
      // Get the specialization IDs from the specializations table
      const { data: specializationData, error: specLookupError } = await supabase
        .from('specializations')
        .select('id, name')
        .in('name', input.specialisation);

      if (specLookupError) {
        console.warn('Could not lookup specialization IDs:', specLookupError.message);
      } else if (specializationData) {
        // Insert specializations using the junction table
        const specializationInserts = specializationData.map(spec => ({
          therapist_id: newTherapist.id,
          specialization_id: spec.id
        }));

        const { error: specError } = await supabase
          .from('therapist_specializations')
          .insert(specializationInserts);

        if (specError) {
          console.warn('Could not save specializations:', specError.message);
        }
      }
    }
  }

  // Optionally write to a separate table if it exists. Non-fatal on error.
  if (documentUrls.length > 0) {
    const { error: docsError } = await supabase
      .from('therapist_documents')
      .insert(
        documentUrls.map((url) => ({
          wallet_address: input.wallet_address,
          url,
          type: 'verification',
        }))
      );
    if (docsError) {
      console.warn('Could not save document URLs to therapist_documents (optional table):', docsError.message);
    }
  }

  // Get the final therapist ID to return
  const { data: finalTherapist, error: finalError } = await supabase
    .from('therapists')
    .select('id')
    .eq('wallet_address', input.wallet_address)
    .single();

  return { 
    success: true, 
    therapist_id: finalTherapist?.id || undefined 
  };
}


