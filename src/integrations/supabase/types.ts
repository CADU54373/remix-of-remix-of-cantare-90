export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      folders: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          parish_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          parish_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          parish_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      music_audio_links: {
        Row: {
          audio_url: string
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          id: string
          music_file_id: string
          parish_id: string | null
          title: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          music_file_id: string
          parish_id?: string | null
          title: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          music_file_id?: string
          parish_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_audio_links_music_file_id_fkey"
            columns: ["music_file_id"]
            isOneToOne: false
            referencedRelation: "music_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "music_audio_links_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      music_files: {
        Row: {
          file_url: string
          folder_id: string
          id: string
          name: string
          parish_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_url: string
          folder_id: string
          id?: string
          name: string
          parish_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_url?: string
          folder_id?: string
          id?: string
          name?: string
          parish_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "music_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "music_files_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      music_video_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          music_file_id: string
          parish_id: string | null
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          music_file_id: string
          parish_id?: string | null
          title: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          music_file_id?: string
          parish_id?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_video_links_music_file_id_fkey"
            columns: ["music_file_id"]
            isOneToOne: false
            referencedRelation: "music_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "music_video_links_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      parishes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      psalm_melodies: {
        Row: {
          added_at: string | null
          added_by: string | null
          date: string
          id: string
          parish_id: string | null
          psalm_index: number
          psalm_reference: string
          psalm_text: string
          youtube_links: Json | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          date: string
          id?: string
          parish_id?: string | null
          psalm_index?: number
          psalm_reference: string
          psalm_text: string
          youtube_links?: Json | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          date?: string
          id?: string
          parish_id?: string | null
          psalm_index?: number
          psalm_reference?: string
          psalm_text?: string
          youtube_links?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "psalm_melodies_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      psalm_melody_audio_links: {
        Row: {
          audio_url: string
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          id: string
          parish_id: string | null
          psalm_melody_id: string
          title: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          parish_id?: string | null
          psalm_melody_id: string
          title: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          parish_id?: string | null
          psalm_melody_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "psalm_melody_audio_links_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psalm_melody_audio_links_psalm_melody_id_fkey"
            columns: ["psalm_melody_id"]
            isOneToOne: false
            referencedRelation: "psalm_melodies"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_salmist_schedules: {
        Row: {
          community: string
          created_at: string | null
          created_by: string | null
          day_of_week: number
          id: string
          is_active: boolean | null
          observations: string | null
          parish_id: string | null
          psalmist: string
          start_month: string
          time: string
          week_of_month: number
        }
        Insert: {
          community: string
          created_at?: string | null
          created_by?: string | null
          day_of_week: number
          id?: string
          is_active?: boolean | null
          observations?: string | null
          parish_id?: string | null
          psalmist: string
          start_month: string
          time: string
          week_of_month: number
        }
        Update: {
          community?: string
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number
          id?: string
          is_active?: boolean | null
          observations?: string | null
          parish_id?: string | null
          psalmist?: string
          start_month?: string
          time?: string
          week_of_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_salmist_schedules_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_schedules: {
        Row: {
          community: string
          created_at: string | null
          created_by: string | null
          day_of_week: number
          id: string
          is_active: boolean | null
          musicians: Json
          observations: string | null
          parish_id: string | null
          start_month: string
          time: string
          type: string
          week_of_month: number
        }
        Insert: {
          community: string
          created_at?: string | null
          created_by?: string | null
          day_of_week: number
          id?: string
          is_active?: boolean | null
          musicians: Json
          observations?: string | null
          parish_id?: string | null
          start_month: string
          time: string
          type: string
          week_of_month: number
        }
        Update: {
          community?: string
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number
          id?: string
          is_active?: boolean | null
          musicians?: Json
          observations?: string | null
          parish_id?: string | null
          start_month?: string
          time?: string
          type?: string
          week_of_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      salmist_schedule_overrides: {
        Row: {
          community: string
          created_at: string | null
          date: string
          id: string
          observations: string | null
          parish_id: string | null
          psalmist: string
          recurring_salmist_schedule_id: string
          specific_month: string
          time: string
        }
        Insert: {
          community: string
          created_at?: string | null
          date: string
          id?: string
          observations?: string | null
          parish_id?: string | null
          psalmist: string
          recurring_salmist_schedule_id: string
          specific_month: string
          time: string
        }
        Update: {
          community?: string
          created_at?: string | null
          date?: string
          id?: string
          observations?: string | null
          parish_id?: string | null
          psalmist?: string
          recurring_salmist_schedule_id?: string
          specific_month?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "salmist_schedule_overrides_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salmist_schedule_overrides_recurring_salmist_schedule_id_fkey"
            columns: ["recurring_salmist_schedule_id"]
            isOneToOne: false
            referencedRelation: "recurring_salmist_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_overrides: {
        Row: {
          community: string
          created_at: string | null
          date: string
          id: string
          musicians: Json
          observations: string | null
          parish_id: string | null
          recurring_schedule_id: string
          specific_month: string
          time: string
          type: string
        }
        Insert: {
          community: string
          created_at?: string | null
          date: string
          id?: string
          musicians: Json
          observations?: string | null
          parish_id?: string | null
          recurring_schedule_id: string
          specific_month: string
          time: string
          type: string
        }
        Update: {
          community?: string
          created_at?: string | null
          date?: string
          id?: string
          musicians?: Json
          observations?: string | null
          parish_id?: string | null
          recurring_schedule_id?: string
          specific_month?: string
          time?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_overrides_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_overrides_recurring_schedule_id_fkey"
            columns: ["recurring_schedule_id"]
            isOneToOne: false
            referencedRelation: "recurring_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      slide_files: {
        Row: {
          file_url: string
          folder_id: string
          id: string
          name: string
          parish_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_url: string
          folder_id: string
          id?: string
          name: string
          parish_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_url?: string
          folder_id?: string
          id?: string
          name?: string
          parish_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slide_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "slide_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slide_files_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      slide_folders: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
          parish_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
          parish_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          parish_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slide_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "slide_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slide_folders_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string
          id: string
          parish_id: string | null
          rejection_reason: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          id: string
          parish_id?: string | null
          rejection_reason?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          parish_id?: string | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_approval_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["approval_status"]
      }
      get_user_parish_id: { Args: { _user_id: string }; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_priest: { Args: { _user_id: string }; Returns: boolean }
      is_priest_of_parish: {
        Args: { _parish_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin_email: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin" | "priest"
      approval_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "super_admin", "priest"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
