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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          id: string
          image_url: string | null
          logged_at: string
          meal_type: string
          name: string
          notes: string | null
          protein_g: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type?: string
          name: string
          notes?: string | null
          protein_g?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_type?: string
          name?: string
          notes?: string | null
          protein_g?: number
          user_id?: string
        }
        Relationships: []
      }
      health_snapshots: {
        Row: {
          active_minutes: number | null
          avg_heart_rate: number | null
          calories_burned: number | null
          captured_on: string
          created_at: string
          distance_m: number | null
          height_cm: number | null
          id: string
          raw: Json | null
          resting_heart_rate: number | null
          sleep_minutes: number | null
          source: string
          steps: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
          workouts_count: number | null
        }
        Insert: {
          active_minutes?: number | null
          avg_heart_rate?: number | null
          calories_burned?: number | null
          captured_on: string
          created_at?: string
          distance_m?: number | null
          height_cm?: number | null
          id?: string
          raw?: Json | null
          resting_heart_rate?: number | null
          sleep_minutes?: number | null
          source: string
          steps?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
          workouts_count?: number | null
        }
        Update: {
          active_minutes?: number | null
          avg_heart_rate?: number | null
          calories_burned?: number | null
          captured_on?: string
          created_at?: string
          distance_m?: number | null
          height_cm?: number | null
          id?: string
          raw?: Json | null
          resting_heart_rate?: number | null
          sleep_minutes?: number | null
          source?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workouts_count?: number | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          raw_event: Json | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          raw_event?: Json | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          raw_event?: Json | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_minutes_today: number | null
          activity_level: string | null
          age: number | null
          ai_plan: Json | null
          ai_plan_generated_at: string | null
          allergies: string[] | null
          avatar_url: string | null
          body_fat_pct: number | null
          carbs_goal_g: number
          created_at: string
          cuisine: string | null
          daily_calorie_goal: number
          diet_preference: string | null
          display_name: string | null
          fat_goal_g: number
          gender: string | null
          health_last_synced_at: string | null
          health_sync_enabled: boolean
          height_cm: number | null
          last_active_date: string | null
          medical_conditions: string[] | null
          muscle_mass_pct: number | null
          onboarded_at: string | null
          physique_goal: string | null
          protein_goal_g: number
          region: string | null
          resting_hr: number | null
          sleep_minutes: number | null
          streak_count: number
          target_weight_kg: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          active_minutes_today?: number | null
          activity_level?: string | null
          age?: number | null
          ai_plan?: Json | null
          ai_plan_generated_at?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          body_fat_pct?: number | null
          carbs_goal_g?: number
          created_at?: string
          cuisine?: string | null
          daily_calorie_goal?: number
          diet_preference?: string | null
          display_name?: string | null
          fat_goal_g?: number
          gender?: string | null
          health_last_synced_at?: string | null
          health_sync_enabled?: boolean
          height_cm?: number | null
          last_active_date?: string | null
          medical_conditions?: string[] | null
          muscle_mass_pct?: number | null
          onboarded_at?: string | null
          physique_goal?: string | null
          protein_goal_g?: number
          region?: string | null
          resting_hr?: number | null
          sleep_minutes?: number | null
          streak_count?: number
          target_weight_kg?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          active_minutes_today?: number | null
          activity_level?: string | null
          age?: number | null
          ai_plan?: Json | null
          ai_plan_generated_at?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          body_fat_pct?: number | null
          carbs_goal_g?: number
          created_at?: string
          cuisine?: string | null
          daily_calorie_goal?: number
          diet_preference?: string | null
          display_name?: string | null
          fat_goal_g?: number
          gender?: string | null
          health_last_synced_at?: string | null
          health_sync_enabled?: boolean
          height_cm?: number | null
          last_active_date?: string | null
          medical_conditions?: string[] | null
          muscle_mass_pct?: number | null
          onboarded_at?: string | null
          physique_goal?: string | null
          protein_goal_g?: number
          region?: string | null
          resting_hr?: number | null
          sleep_minutes?: number | null
          streak_count?: number
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          display_name: string | null
          id: string
          joined_at: string
          squad_id: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          joined_at?: string
          squad_id: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          joined_at?: string
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_rewards: {
        Row: {
          awarded_at: string
          badge: string | null
          coupon_code: string | null
          id: string
          platinum_days: number
          points: number
          rank: number
          squad_id: string
          user_id: string
          xp_bonus: number
        }
        Insert: {
          awarded_at?: string
          badge?: string | null
          coupon_code?: string | null
          id?: string
          platinum_days?: number
          points?: number
          rank: number
          squad_id: string
          user_id: string
          xp_bonus?: number
        }
        Update: {
          awarded_at?: string
          badge?: string | null
          coupon_code?: string | null
          id?: string
          platinum_days?: number
          points?: number
          rank?: number
          squad_id?: string
          user_id?: string
          xp_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "squad_rewards_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          challenge_type: Database["public"]["Enums"]["squad_challenge_type"]
          code: string
          created_at: string
          custom_challenge: string | null
          ends_at: string
          finalized_at: string | null
          goal_description: string | null
          goal_target: number | null
          id: string
          name: string
          owner_id: string
          period: Database["public"]["Enums"]["squad_period"]
          starts_at: string
          updated_at: string
        }
        Insert: {
          challenge_type?: Database["public"]["Enums"]["squad_challenge_type"]
          code: string
          created_at?: string
          custom_challenge?: string | null
          ends_at: string
          finalized_at?: string | null
          goal_description?: string | null
          goal_target?: number | null
          id?: string
          name: string
          owner_id: string
          period?: Database["public"]["Enums"]["squad_period"]
          starts_at?: string
          updated_at?: string
        }
        Update: {
          challenge_type?: Database["public"]["Enums"]["squad_challenge_type"]
          code?: string
          created_at?: string
          custom_challenge?: string | null
          ends_at?: string
          finalized_at?: string | null
          goal_description?: string | null
          goal_target?: number | null
          id?: string
          name?: string
          owner_id?: string
          period?: Database["public"]["Enums"]["squad_period"]
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_paid: number | null
          created_at: string
          currency: string | null
          current_period_expires_at: string | null
          current_period_started_at: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          silver_plans_used: number
          status: Database["public"]["Enums"]["subscription_status"]
          trial_expires_at: string
          trial_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          current_period_expires_at?: string | null
          current_period_started_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          silver_plans_used?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_expires_at?: string
          trial_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          currency?: string | null
          current_period_expires_at?: string | null
          current_period_started_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          silver_plans_used?: number
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_expires_at?: string
          trial_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          id: string
          logged_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          id?: string
          logged_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          id?: string
          logged_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number
          created_at: string
          duration_min: number
          id: string
          logged_at: string
          name: string
          notes: string | null
          source: string | null
          source_id: string | null
          user_id: string
          workout_type: string
        }
        Insert: {
          calories_burned?: number
          created_at?: string
          duration_min?: number
          id?: string
          logged_at?: string
          name: string
          notes?: string | null
          source?: string | null
          source_id?: string | null
          user_id: string
          workout_type?: string
        }
        Update: {
          calories_burned?: number
          created_at?: string
          duration_min?: number
          id?: string
          logged_at?: string
          name?: string
          notes?: string | null
          source?: string | null
          source_id?: string | null
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_squad_by_code: {
        Args: { _code: string }
        Returns: {
          ends_at: string
          finalized_at: string
          id: string
          name: string
        }[]
      }
      is_squad_member: {
        Args: { _squad_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      squad_challenge_type:
        | "weight_loss"
        | "muscle_gain"
        | "steps"
        | "healthy_eating"
        | "workout"
        | "hydration"
        | "sleep"
        | "custom"
      squad_period: "weekly" | "monthly"
      subscription_plan: "trial" | "silver" | "gold" | "platinum" | "expired"
      subscription_status: "active" | "expired" | "cancelled" | "pending"
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
      squad_challenge_type: [
        "weight_loss",
        "muscle_gain",
        "steps",
        "healthy_eating",
        "workout",
        "hydration",
        "sleep",
        "custom",
      ],
      squad_period: ["weekly", "monthly"],
      subscription_plan: ["trial", "silver", "gold", "platinum", "expired"],
      subscription_status: ["active", "expired", "cancelled", "pending"],
    },
  },
} as const
