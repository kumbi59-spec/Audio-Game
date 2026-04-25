"use server";
import { signIn } from "@/auth";
export async function signInAction(formData: FormData) {
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    mode: formData.get("mode"),
    redirectTo: "/",
  });
}
