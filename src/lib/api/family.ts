import { sb } from '@/lib/supabase/client'
import type { ApiResult, Household, HouseholdMember } from '@/types'

const MIGRATION_HINT = 'Chưa bật tính năng Gia đình: hãy chạy supabase/migrations/004_family.sql trong Supabase → SQL Editor.'
const msg = (e: any) => {
  const m: string = e?.message ?? String(e)
  return /schema cache|does not exist|Could not find the (table|function)/i.test(m) ? MIGRATION_HINT : m
}
// Chuẩn hóa: chuỗi rỗng → null (cột DATE/UUID không nhận '')
const clean = <T extends Record<string, any>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' ? null : v])) as T

/** CRUD chung cho mọi bảng dữ liệu gia đình (phân quyền do RLS ở database đảm nhận) */
export const famTable = <T extends { id: string }>(table: string, order: { col: string; asc?: boolean }[] = []) => ({
  async list(householdId: string, filter?: Record<string, string>): Promise<ApiResult<T[]>> {
    try {
      let q = sb().from(table).select('*').eq('household_id', householdId)
      for (const [k, v] of Object.entries(filter ?? {})) q = q.eq(k, v)
      for (const o of order) q = q.order(o.col, { ascending: o.asc ?? true })
      const { data, error } = await q.limit(5000)
      if (error) throw error
      return { data: (data ?? []) as T[], error: null }
    } catch (e) { return { data: null, error: msg(e) } }
  },
  async create(householdId: string, row: Partial<T> | Partial<T>[]): Promise<ApiResult<T[]>> {
    try {
      const rows = (Array.isArray(row) ? row : [row]).map(r => clean({ ...r, household_id: householdId }))
      const { data, error } = await sb().from(table).insert(rows).select()
      if (error) throw error
      return { data: data as T[], error: null }
    } catch (e) { return { data: null, error: msg(e) } }
  },
  async update(id: string, patch: Partial<T>): Promise<ApiResult<T>> {
    try {
      const { data, error } = await sb().from(table).update(clean(patch as any)).eq('id', id).select().single()
      if (error) throw error
      return { data: data as T, error: null }
    } catch (e) { return { data: null, error: msg(e) } }
  },
  async remove(id: string): Promise<ApiResult<null>> {
    try {
      const { error } = await sb().from(table).delete().eq('id', id)
      if (error) throw error
      return { data: null, error: null }
    } catch (e) { return { data: null, error: msg(e) } }
  },
})

// ── Hộ gia đình ───────────────────────────────────────────────────────────────
export async function listHouseholds(): Promise<ApiResult<Household[]>> {
  try {
    const { data, error } = await sb().from('households').select('*').order('created_at')
    if (error) throw error
    return { data: data as Household[], error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}
export async function createHousehold(name: string, relation?: string): Promise<ApiResult<Household>> {
  try {
    const { data: { user } } = await sb().auth.getUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const { data, error } = await sb().from('households').insert({ name, owner_id: user.id, owner_relation: relation || null }).select().single()
    if (error) throw error
    return { data: data as Household, error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}
export async function updateHousehold(id: string, patch: Partial<Pick<Household, 'name' | 'owner_relation'>>): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('households').update(patch).eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}
export async function deleteHousehold(id: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('households').delete().eq('id', id)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}
export async function listHouseholdMembers(id: string): Promise<ApiResult<HouseholdMember[]>> {
  try {
    const { data, error } = await sb().rpc('list_household_members', { p_household_id: id })
    if (error) throw error
    return { data: data as HouseholdMember[], error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}
export async function addHouseholdMember(id: string, email: string, role: 'editor' | 'viewer', relation?: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().rpc('add_household_member', { p_household_id: id, p_email: email, p_role: role, p_relation: relation || null })
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}
export async function updateHouseholdMember(id: string, userId: string, patch: { role?: 'editor' | 'viewer'; relation?: string | null }): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('household_members').update(patch).eq('household_id', id).eq('user_id', userId)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}
export async function removeHouseholdMember(id: string, userId: string): Promise<ApiResult<null>> {
  try {
    const { error } = await sb().from('household_members').delete().eq('household_id', id).eq('user_id', userId)
    if (error) throw error
    return { data: null, error: null }
  } catch (e) { return { data: null, error: msg(e) } }
}

// ── Bảng dữ liệu ──────────────────────────────────────────────────────────────
import type { Wallet, Txn, Bill, FinBudget, Pregnancy, PregVisit, PregCost, BabyItem, Child, Vaccination, GrowthRecord, ChildEvent, SavingsGoal, GoalContribution, Loan, LoanPayment, Debt, Gift, Asset, FamilyDoc } from '@/types'
export const T = {
  wallets:      famTable<Wallet>('wallets', [{ col: 'created_at' }]),
  txns:         famTable<Txn>('transactions', [{ col: 'date', asc: false }, { col: 'created_at', asc: false }]),
  bills:        famTable<Bill>('recurring_bills', [{ col: 'day_of_month' }]),
  budgets:      famTable<FinBudget>('fin_budgets', [{ col: 'category' }]),
  pregnancies:  famTable<Pregnancy>('pregnancies', [{ col: 'due_date', asc: false }]),
  visits:       famTable<PregVisit>('pregnancy_visits', [{ col: 'date', asc: false }]),
  pregCosts:    famTable<PregCost>('pregnancy_costs', [{ col: 'position' }]),
  babyItems:    famTable<BabyItem>('baby_items', [{ col: 'position' }]),
  children:     famTable<Child>('children', [{ col: 'dob' }]),
  vaccines:     famTable<Vaccination>('vaccinations', [{ col: 'due_date' }]),
  growth:       famTable<GrowthRecord>('growth_records', [{ col: 'date' }]),
  childEvents:  famTable<ChildEvent>('child_events', [{ col: 'date', asc: false }]),
  goals:        famTable<SavingsGoal>('savings_goals', [{ col: 'created_at' }]),
  contribs:     famTable<GoalContribution>('goal_contributions', [{ col: 'date', asc: false }]),
  loans:        famTable<Loan>('loans', [{ col: 'start_date' }]),
  loanPays:     famTable<LoanPayment>('loan_payments', [{ col: 'date', asc: false }]),
  debts:        famTable<Debt>('debts', [{ col: 'date', asc: false }]),
  gifts:        famTable<Gift>('gift_book', [{ col: 'date', asc: false }]),
  assets:       famTable<Asset>('assets', [{ col: 'value', asc: false }]),
  docs:         famTable<FamilyDoc>('family_documents', [{ col: 'expiry_date' }]),
}
