# AttendEase

## Roles & approvals

| Role    | How the account is created                  | Who approves it                |
|---------|---------------------------------------------|--------------------------------|
| Student | Self-registers                              | Any approved teacher           |
| Teacher | Self-registers                              | **An administrator only**      |
| Admin   | Created by hand in the Firebase console     | n/a (cannot be self-registered) |

Admins can approve, reject, **revoke**, and restore teachers from the Administrator Console.
A revoked teacher is locked out immediately, even if currently signed in, and the
Firestore rules enforce this on the server (not just in the UI).

## One-time setup: create the first admin

1. **Firebase Console → Authentication → Sign-in method**: enable **Email/Password**.
2. **Authentication → Users → Add user**
   - Email: `admin.admin-001@cedric.edu`
   - Password: choose a strong one
   - Copy the new user's **UID**.
3. **Firestore Database → `users` collection → Add document**
   - **Document ID:** the UID from step 2
   - Fields (all strings):

   | field                | value                          |
   |----------------------|--------------------------------|
   | `uid`                | *(the same UID)*               |
   | `userCode`           | `ADMIN-001`                    |
   | `name`               | your name                      |
   | `email`              | your real contact email        |
   | `syntheticEmail`     | `admin.admin-001@cedric.edu`   |
   | `role`               | `admin`                        |
   | `status`             | `approved`                     |
   | `departmentOrLocation` | `Administration`             |
   | `createdAt`          | e.g. `2026-10-03T00:00:00.000Z` |

4. **Deploy the security rules** (they are not deployed by the GitHub Pages workflow):
   `firebase deploy --only firestore:rules`, or paste `firestore.rules` into
   Firestore → Rules → Publish.
5. On the sign-in page click **Administrator sign in**, then use ID `ADMIN-001` and your password.

To use a different admin ID, the Auth email must be `admin.<id-lowercase>@cedric.edu`
(letters, digits, `_` and `-` only), and `userCode`/`syntheticEmail` must match.
