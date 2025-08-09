import { supabase, Client } from './supabase';
import { AuthProvider } from '@mysten/enoki';

export interface CreateClientData {
  wallet_address: string;
  anon_display_name?: string;
  email?: string;
  auth_provider: 'google' | 'facebook' | 'twitch';
  provider_subject: string;
  timezone?: string;
  preferences?: string[];
  vibe_tags?: string[];
}

export interface UpdateClientData {
  anon_display_name?: string;
  email?: string;
  timezone?: string;
  preferences?: string[];
  vibe_tags?: string[];
  last_login?: string;
}

/**
 * Client service for managing client profiles in Supabase
 * Uses wallet_address as the primary key for zkLogin integration
 */
export class ClientService {
  /**
   * Create a new client profile
   * This should be called after successful zkLogin authentication
   */
  static async createClient(data: CreateClientData): Promise<Client | null> {
    try {
      const clientData = {
        wallet_address: data.wallet_address,
        anon_display_name: data.anon_display_name || `Anonymous_${Math.random().toString(36).substr(2, 6)}`,
        email: data.email,
        auth_provider: data.auth_provider,
        provider_subject: data.provider_subject,
        timezone: data.timezone || 'UTC',
        preferences: data.preferences || [],
        vibe_tags: data.vibe_tags || [],
        total_sessions: 0,
        total_spent_sui: 0,
        is_verified: false,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Creating client in Supabase:', clientData);

      const { data: client, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating client:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('✅ Client created successfully in Supabase:', client);
      return client;
    } catch (error) {
      console.error('💥 Unexpected error in createClient:', error);
      return null;
    }
  }

  /**
   * Get client by wallet address (primary key)
   */
  static async getClientByWalletAddress(wallet_address: string): Promise<Client | null> {
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('wallet_address', wallet_address)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No client found - this is expected for new users
          return null;
        }
        console.error('Error fetching client:', error);
        return null;
      }

      return client;
    } catch (error) {
      console.error('Error in getClientByWalletAddress:', error);
      return null;
    }
  }

  /**
   * Get all clients (for admin purposes - optional)
   */
  static async getAllClients(): Promise<Client[]> {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all clients:', error);
        return [];
      }

      return clients || [];
    } catch (error) {
      console.error('Error in getAllClients:', error);
      return [];
    }
  }

  /**
   * Update client profile
   */
  static async updateClient(wallet_address: string, updates: UpdateClientData): Promise<Client | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data: client, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('wallet_address', wallet_address)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        return null;
      }

      return client;
    } catch (error) {
      console.error('Error in updateClient:', error);
      return null;
    }
  }

  /**
   * Update client's last login timestamp
   */
  static async updateLastLogin(wallet_address: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', wallet_address);

      if (error) {
        console.error('Error updating last login:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLastLogin:', error);
      return false;
    }
  }

  /**
   * Get or create client profile
   * This is the main function to call after zkLogin authentication
   */
  static async getOrCreateClient(
    wallet_address: string, 
    auth_provider: 'google' | 'facebook' | 'twitch',
    provider_subject: string,
    email?: string
  ): Promise<Client | null> {
    try {
      // First, try to get existing client
      let client = await this.getClientByWalletAddress(wallet_address);
      
      if (client) {
        // Update last login for existing client
        await this.updateLastLogin(wallet_address);
        return client;
      }

      // Create new client if not found
      client = await this.createClient({
        wallet_address,
        auth_provider,
        provider_subject,
        email,
      });

      return client;
    } catch (error) {
      console.error('Error in getOrCreateClient:', error);
      return null;
    }
  }

  /**
   * Increment session count and total spent
   * Called after successful session completion
   */
  static async incrementSessionStats(wallet_address: string, session_cost_sui: number): Promise<boolean> {
    try {
      // Get current client data
      const client = await this.getClientByWalletAddress(wallet_address);
      if (!client) return false;

      const { error } = await supabase
        .from('clients')
        .update({ 
          total_sessions: client.total_sessions + 1,
          total_spent_sui: client.total_spent_sui + session_cost_sui,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', wallet_address);

      if (error) {
        console.error('Error updating session stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in incrementSessionStats:', error);
      return false;
    }
  }

  /**
   * Delete client profile (for account deletion)
   */
  static async deleteClient(wallet_address: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('wallet_address', wallet_address);

      if (error) {
        console.error('Error deleting client:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteClient:', error);
      return false;
    }
  }
}