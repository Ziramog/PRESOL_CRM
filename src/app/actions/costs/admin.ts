'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAssets() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('assets').select('*').order('code');
  if (error) throw new Error(error.message);
  return data;
}

export async function createAsset(assetData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('assets').insert(assetData).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateAsset(id: string, assetData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('assets').update(assetData).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getPersonnelCosts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('personnel_costs').select('*').order('code');
  if (error) throw new Error(error.message);
  return data;
}

export async function createPersonnelCost(personnelData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('personnel_costs').insert(personnelData).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updatePersonnelCost(id: string, personnelData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('personnel_costs').update(personnelData).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getAdminConfigurations() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('configurations').select('*').order('code');
  if (error) throw new Error(error.message);
  return data;
}

export async function updateConfiguration(id: string, configData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('configurations').update(configData).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getAdminParameters() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('pricing_parameters').select('*').order('category');
  if (error) throw new Error(error.message);
  return data;
}

export async function updateParameter(id: string, numeric_value: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('pricing_parameters').update({ numeric_value }).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getAdminOperationMargins() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('operation_margin_rules').select('*').order('operation_type');
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOperationMargin(id: string, margin_ratio: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('operation_margin_rules').update({ margin_ratio }).eq('id', id).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
