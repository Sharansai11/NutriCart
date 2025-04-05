import { createContext, useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../api/firebaseConfig";  // Ensure correct import

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Register a new user with the provided role
  async function register(email, password, name, role = "user") {
    try {
      setError("");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      // Create a user document in Firestore with the chosen role
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        displayName: name,
        role, // Uses the role parameter (user or admin)
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Check user role in Firestore
  async function checkUserRole(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      return "user"; // Default role if not set
    } catch (err) {
      console.error("Error checking user role:", err);
      return "user"; // Default role on error
    }
  }

  // Login a user and verify the role (if needed)
  async function login(email, password, selectedRole = "user") {
    try {
      setError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time in Firestore
      await setDoc(
        doc(db, "users", userCredential.user.uid), 
        { lastLogin: serverTimestamp() }, 
        { merge: true }
      );
      
      // Verify user role
      const role = await checkUserRole(userCredential.user.uid);
      if (role !== selectedRole) {
        await signOut(auth);
        throw new Error(`This account does not have ${selectedRole} privileges.`);
      }
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Logout the current user
  function logout() {
    setError("");
    return signOut(auth);
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const role = await checkUserRole(user.uid);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    register,
    login,
    logout,
    error,
    setError,
    isAdmin: userRole === "admin"
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
