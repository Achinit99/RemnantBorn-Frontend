/**
 * What: Lightweight redirect page from create-account to signup.
 * Why: Keeps old/alternate entry paths working without duplicating signup UI.
 */
import { redirect } from "next/navigation"

export default function CreateAccountRedirectPage() {
  redirect("/signup")
}
