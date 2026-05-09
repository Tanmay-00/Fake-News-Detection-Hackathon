import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User } from "../types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let userData: User;
        if (!userSnap.exists()) {
          userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "Anonymous Agent",
            role: "Researcher",
            avatar: firebaseUser.photoURL || undefined
          };
          await setDoc(userRef, userData);
        } else {
          userData = userSnap.data() as User;
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}
