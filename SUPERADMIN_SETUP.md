# Super Admin Setup (Supabase Authentication)

Church **super admin** accounts are created in **Supabase Authentication**, not via scripts or environment variables.

Regular **members** still register on the website (`/register`) and log in with username + password.

---

## Step 1 — Run database migration

In **Supabase → SQL Editor**, run:

1. `database.sql` (if not already done)
2. `database_supabase_auth.sql` — links `members.auth_user_id` to Supabase Auth users
3. `database_member_profile.sql` (optional, for member profiles)

---

## Step 2 — Add environment variable

In **Render** (or `.env` locally), add the **anon/public** key:

```env
SUPABASE_ANON_KEY=your-anon-public-key
```

Find it in **Supabase → Settings → API → Project API keys → anon public**.

You already have `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for the backend database.

---

## Step 3 — Create super admin in Supabase

1. Open **Supabase Dashboard → Authentication → Users**
2. Click **Add user → Create new user**
3. Enter **Email** and **Password**
4. Enable **Auto Confirm User** (recommended)
5. Under **User Metadata**, paste:

```json
{
  "role": "super_admin",
  "full_name": "Church Super Admin"
}
```

6. Click **Create user**

---

## Step 4 — Sign in on the website

1. Go to your site **`/login`**
2. Enter the **email** and **password** from Supabase Authentication
3. Open **Admin** from the member portal or navbar

On first login, the app automatically creates a linked row in the `members` table with `role = super_admin`.

---

## Adding more admins

| Role | How to create |
|------|----------------|
| **Super Admin** | Supabase Auth → Add user + metadata `"role": "super_admin"` |
| **Admin / Leader** | Supabase Auth with `"role": "admin"` or promote in Admin → Members |
| **Member** | Website registration at `/register` |

---

## Troubleshooting

**“Invalid credentials” after creating Supabase user**

- Confirm `SUPABASE_ANON_KEY` is set on Render and redeployed
- Use the **email** (not username) from Supabase Auth
- Ensure **Auto Confirm User** was enabled, or confirm the user in Supabase

**Login works but no Admin access**

- Edit the user in Supabase → **User Metadata** must include `"role": "super_admin"`
- Or run SQL:  
  `UPDATE members SET role = 'super_admin' WHERE email = 'you@example.com';`

**Column auth_user_id does not exist**

- Run `database_supabase_auth.sql` in the Supabase SQL editor

---

## Deprecated (do not use)

- `SUPERADMIN_EMAIL` environment variable
- `python scripts/create_superadmin.py` (kept for emergency fallback only)
- `/api/admin/bootstrap` endpoint
