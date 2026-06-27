// /lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://spvtvngfhkmwakjhqkgx.supabase.co";
const supabaseAnonKey = "sb_publishable_wx3q7vgK8L9I80JxKiYsYA_voV2bM9j";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
