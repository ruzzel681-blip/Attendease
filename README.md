# AttendEase

## Roles & approvals

| Role    | How the account is created                  | Who approves it                |
|---------|---------------------------------------------|--------------------------------|
| Student | Self-registers                              | Not needed: active immediately |
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

## What each role can do

| Action                                   | Student | Teacher                      | Admin                  |
|------------------------------------------|:-------:|:----------------------------:|:----------------------:|
| Use teacher tools (classes, attendance)  | no      | yes (after admin approval)   | **yes (acts as a teacher too)** |
| Approve / revoke / delete teachers       | no      | **no**                       | yes                    |
| Approve a student's request to join a class | no   | **only for classes they created** | any class     |
| Edit, delete, or remove students from a class | no | **only classes they created** | any class              |

The admin switches between **Admin Console** and **Teaching (as Teacher)** using the bar under the header.
These limits are enforced in `firestore.rules`, not just in the UI.

**Deleting a teacher** (trash icon in the Admin Console) removes their profile so they can no longer sign in.
Their Firebase *login* can only be removed from Firebase Console → Authentication; until you do that their ID
cannot be registered again. Use **Revoke** if you only want to block access and keep the record.

**Admin account (register-first option):** register as a Teacher with ID `ADMIN-001`, then in Firestore set that
user's `role` to `admin` and `status` to `approved`, and sign in with **Administrator sign in**.

## Broadcast to all students (works with no class)

A teacher can post an announcement with **Course / Subject = "Broadcast to ALL students (no class needed)"**.
Every student sees it in the Announcements tab, even if they are not in any class yet. The teacher can also pick
one of their own classes under **Invite students to join one of your classes**; the announcement then shows that
class's code with a **Copy** button and a **Request to join** button. The class's teacher still approves each request.
