
'use client';
/**
 * @fileOverview A client-side utility for creating a Firebase user and their profile.
 */

import { z } from 'zod';
import { Auth, UserCredential, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, Firestore } from 'firebase/firestore';

// Define input schema for the user creation function
const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

/**
 * Creates a user in Firebase Authentication and then creates their profile document in Firestore.
 * This is a client-side function.
 * @param auth - The Firebase Auth instance.
 * @param firestore - The Firestore instance.
 * @param input - The user's details.
 * @returns The UserCredential from creating the user.
 */
export async function createUser(
  auth: Auth,
  firestore: Firestore,
  input: CreateUserInput
): Promise<UserCredential> {
  try {
    // 1. Create the user in Firebase Authentication using the Client SDK
    const userCredential = await createUserWithEmailAndPassword(auth, input.email, input.password);
    const user = userCredential.user;

    // 2. Update the user's display name in Firebase Auth
    await updateProfile(user, {
      displayName: `${input.firstName} ${input.lastName}`
    });

    // 3. Create the user profile in Firestore using the Client SDK
    const profileRef = doc(firestore, 'profiles', user.uid);
    await setDoc(profileRef, {
      userId: user.uid,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      createdAt: serverTimestamp(),
    });

    return userCredential;

  } catch (error: any) {
    // Re-throw the error so the calling component can handle it.
    // The client SDK provides specific error codes (e.g., 'auth/email-already-in-use')
    // that can be handled in the UI.
    console.error("Error creating user:", error);
    throw error;
  }
}
