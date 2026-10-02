export type TaskStatus   = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low'  | 'medium'       | 'high'

export interface Profile { id:string; full_name:string|null; avatar_url:string|null; phone:string|null; created_at:string; updated_at:string }
export interface Project { id:string; user_id:string; name:string; description:string|null; event_date:string|null; venue:string|null; budget_total:number; cover_url:string|null; tags:string[]; created_at:string; updated_at:string }
export interface ProjectSummary extends Project { total_tasks:number; completed_tasks:number; total_estimated:number; total_spent:number }
export interface Task { id:string; project_id:string; assigned_to:string|null; title:string; description:string|null; status:TaskStatus; priority:TaskPriority; tags:string[]; deadline:string|null; cost_estimate:number; cost_actual:number; position:number; created_at:string; updated_at:string }
export interface Expense { id:string; project_id:string; task_id:string|null; vendor_id?:string|null; created_by:string|null; amount:number; note:string|null; category:string; spent_at:string; created_at:string }
export interface ApiResult<T> { data:T|null; error:string|null }

// ── Tài khoản & phân quyền ─────────────────────────────────────
export type AppRole    = 'user' | 'admin'
export type MemberRole = 'editor' | 'viewer'
export type ProjectRole = 'owner' | 'admin' | MemberRole
export interface UserProfile extends Profile { email:string|null; role:AppRole; is_active:boolean; last_seen_at:string|null }
export interface ProjectMember { user_id:string; full_name:string|null; email:string|null; avatar_url:string|null; role:ProjectRole; created_at:string }
export interface AdminUserRow { id:string; full_name:string|null; email:string|null; phone:string|null; avatar_url:string|null; role:AppRole; is_active:boolean; created_at:string; last_seen_at:string|null; project_count:number; invitation_count:number }
export interface AdminStats { users:number; admins:number; locked:number; projects:number; invitations:number; published:number; views:number; rsvps:number; attending_guests:number; wishes:number; new_users_7d:number }

// ── Thiệp cưới online ─────────────────────────────────────────
export type TemplateId =
  | 'classic' | 'floral' | 'modern' | 'songhy' | 'garden' | 'midnight'
  | 'lotus' | 'indochine' | 'royal' | 'blackgold' | 'sakura' | 'lavender'
  | 'ocean' | 'autumn' | 'mint' | 'pure' | 'party' | 'vintage'
export type TemplateCategory = 'traditional' | 'romantic' | 'modern' | 'luxury' | 'nature'
export type PatternId  = 'none' | 'dots' | 'grid' | 'damask' | 'waves' | 'paper' | 'hearts'
export type EffectId   = 'petals' | 'hearts' | 'snow' | 'sparkles' | 'leaves' | 'confetti' | 'bubbles' | 'none'
export type CoverLayout = 'overlay' | 'arch' | 'split' | 'minimal' | 'frame' | 'circle' | 'polaroid'
export type SectionId  = 'countdown' | 'couple' | 'story' | 'events' | 'gallery' | 'rsvp' | 'wishes' | 'gift'
export type Side = 'groom' | 'bride' | 'both'

export interface Person { name:string; full_name:string; father:string; mother:string; bio:string; photo:string }
export interface StoryItem { id:string; date:string; title:string; text:string; image:string }
export interface EventItem { id:string; name:string; start:string; venue:string; address:string; map_url:string; note:string }
export interface GiftAccount { id:string; side:Side; label:string; bank:string; account_number:string; account_name:string }
export interface SectionConfig { id:SectionId; visible:boolean; title?:string }

export interface InvitationContent {
  groom: Person
  bride: Person
  headline: string
  invite_text: string
  quote: string
  cover_url: string
  hashtag: string
  dress_code: string[]
  story: StoryItem[]
  events: EventItem[]
  gallery: string[]
  gifts: GiftAccount[]
  sections: SectionConfig[]
  closing: string
}

export interface InvitationTheme {
  template: TemplateId
  layout: CoverLayout
  primary: string
  accent: string
  background: string
  text: string
  heading_font: string
  body_font: string
  effect: EffectId
  envelope: boolean
  music_url: string
  overlay: number
  radius: number
  pattern: PatternId
}

export interface Invitation {
  id:string; user_id:string; project_id:string|null; slug:string; title:string; event_date:string|null
  content:InvitationContent; theme:InvitationTheme; is_published:boolean; view_count:number
  created_at:string; updated_at:string
}
export interface InvitationListItem extends Invitation { rsvp_count?:number; wish_count?:number }
export interface Guest { id:string; invitation_id:string; name:string; salutation:string|null; phone:string|null; side:Side; group_name:string|null; invited_count:number; code:string; is_sent:boolean; note:string|null; created_at:string }
export interface Rsvp { id:string; invitation_id:string; guest_id:string|null; name:string; phone:string|null; attending:'yes'|'no'|'maybe'; guest_count:number; side:Side|null; message:string|null; created_at:string }
export interface Wish { id:string; invitation_id:string; name:string; message:string; is_hidden:boolean; created_at:string }
export interface GuestGreeting { name:string; salutation:string|null; invited_count:number; side:Side }

// ── Nhà cung cấp & lịch trình ngày cưới ───────────────────────
export type VendorStatus = 'considering' | 'booked' | 'cancelled'
export interface Vendor { id:string; project_id:string; name:string; category:string; contact_name:string|null; phone:string|null; email:string|null; website:string|null; status:VendorStatus; total_cost:number; due_date:string|null; rating:number|null; notes:string|null; created_at:string; updated_at:string }
export interface ScheduleItem { id:string; project_id:string; day:string|null; start_time:string|null; end_time:string|null; title:string; location:string|null; owner:string|null; notes:string|null; done:boolean; position:number; created_at:string }

// ── Gia đình ──────────────────────────────────────────────────
export interface Household { id:string; name:string; owner_id:string; owner_relation:string|null; created_at:string }
export interface HouseholdMember { user_id:string; full_name:string|null; email:string|null; avatar_url:string|null; role:'owner'|'editor'|'viewer'; relation:string|null }
export interface Wallet { id:string; household_id:string; name:string; type:'cash'|'bank'|'credit'|'ewallet'|'saving'; owner_user:string|null; opening_balance:number; color:string|null; archived:boolean }
export interface Txn { id:string; household_id:string; kind:'income'|'expense'|'transfer'; amount:number; category:string; wallet_id:string|null; to_wallet_id:string|null; member_id:string|null; child_id:string|null; bill_id:string|null; date:string; note:string|null; created_by:string|null; created_at:string }
export interface Bill { id:string; household_id:string; name:string; kind:'income'|'expense'; amount:number; category:string; wallet_id:string|null; child_id:string|null; frequency:'monthly'|'quarterly'|'yearly'; day_of_month:number; start_month:string|null; remind_days:number; active:boolean; note:string|null }
export interface FinBudget { id:string; household_id:string; category:string; amount:number }
export interface Pregnancy { id:string; household_id:string; mother_name:string|null; lmp:string|null; due_date:string; status:'active'|'born'|'ended'; baby_name:string|null; hospital:string|null; doctor:string|null; notes:string|null }
export interface PregVisit { id:string; household_id:string; pregnancy_id:string; date:string; type:string; place:string|null; mom_weight:number|null; blood_pressure:string|null; fetal_weight:number|null; notes:string|null; cost:number }
export interface PregCost { id:string; household_id:string; pregnancy_id:string; item:string; estimate:number; actual:number; position:number }
export interface BabyItem { id:string; household_id:string; pregnancy_id:string|null; grp:string; name:string; qty:number; price:number; bought:boolean; essential:boolean; position:number }
export interface Child { id:string; household_id:string; name:string; nickname:string|null; dob:string; gender:'male'|'female'; blood_type:string|null; allergies:string|null; avatar_url:string|null; notes:string|null }
export interface Vaccination { id:string; household_id:string; child_id:string; vaccine:string; dose:string|null; program:'epi'|'service'; due_date:string; done_date:string|null; place:string|null; note:string|null }
export interface GrowthRecord { id:string; household_id:string; child_id:string; date:string; weight_kg:number|null; height_cm:number|null; head_cm:number|null; note:string|null }
export interface ChildEvent { id:string; household_id:string; child_id:string; kind:'milestone'|'medical'; date:string; title:string; note:string|null; photo_url:string|null }
export interface SavingsGoal { id:string; household_id:string; name:string; icon:string|null; target:number; deadline:string|null; done:boolean }
export interface GoalContribution { id:string; household_id:string; goal_id:string; amount:number; date:string; note:string|null }
export interface Loan { id:string; household_id:string; name:string; lender:string|null; principal:number; annual_rate:number; term_months:number; start_date:string; method:'declining'|'annuity'; closed:boolean; note:string|null }
export interface LoanPayment { id:string; household_id:string; loan_id:string; period:number|null; date:string; principal:number; interest:number; note:string|null }
export interface Debt { id:string; household_id:string; person:string; direction:'lent'|'borrowed'; amount:number; date:string; due_date:string|null; settled:boolean; settled_date:string|null; note:string|null }
export interface Gift { id:string; household_id:string; person:string; relation:string|null; event:string; direction:'received'|'given'; amount:number; gift:string|null; date:string; note:string|null }
export interface Asset { id:string; household_id:string; name:string; type:string; value:number; acquired_date:string|null; note:string|null }
export interface FamilyDoc { id:string; household_id:string; name:string; type:string; number:string|null; holder:string|null; issued_date:string|null; expiry_date:string|null; note:string|null }
