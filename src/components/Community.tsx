import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  ArrowBigUp, 
  ArrowBigDown, 
  Plus, 
  Filter, 
  Search, 
  ChevronRight, 
  User as UserIcon,
  ShieldCheck,
  TrendingUp,
  Clock,
  LogIn,
  LogOut,
  Settings,
  Edit3,
  Camera,
  X,
  Check,
  Loader2,
  Trash2
} from "lucide-react";
import { Thread, Comment, User } from "../types";
import { cn } from "../lib/utils";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  setDoc,
  where,
  serverTimestamp, 
  increment,
  limit,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

const MOCK_USER: User = {
  id: "u1",
  name: "Dr. Aris Thorne",
  role: "Expert",
};

export default function Community({ onAuthOpen }: { onAuthOpen: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth & Profile States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [authError, setAuthError] = useState<string | null>(null);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [profileThreads, setProfileThreads] = useState<Thread[]>([]);
  const [profileComments, setProfileComments] = useState<Comment[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", avatar: "", role: "" as any });

  // Error/Toast State
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const parseErrorMessage = (error: any) => {
    try {
      // Check if it's our JSON error from handleFirestoreError
      const parsed = JSON.parse(error.message);
      if (parsed.error && parsed.error.includes("permission-denied")) {
        return "Permission Denied: Your security clearance is insufficient for this action.";
      }
      if (parsed.error && parsed.error.includes("quota-exceeded")) {
        return "System Overload: Neural bandwidth quota exceeded. Please try again tomorrow.";
      }
      return parsed.error || "A secure protocol violation occurred.";
    } catch {
      // Fallback for standard errors
      if (error.message?.includes("network-request-failed")) return "Neural Link Severed: Check your connection.";
      if (error.message?.includes("auth/user-not-found")) return "Agent ID not found in database.";
      if (error.message?.includes("auth/wrong-password")) return "Bio-Key mismatch. Authentication failed.";
      return error.message || "Unknown system failure.";
    }
  };

  // Nested Comments Logic
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const buildCommentTree = (flatComments: Comment[]) => {
    const map = new Map<string, Comment & { replies: Comment[] }>();
    const roots: (Comment & { replies: Comment[] })[] = [];

    // First pass: Create nodes
    flatComments.forEach(c => {
      map.set(c.id, { ...c, replies: [] });
    });

    // Second pass: Build parent-child links
    flatComments.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by date (descending) within levels
    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => {
        const da = (a as any).createdAt?.seconds || 0;
        const db = (b as any).createdAt?.seconds || 0;
        return db - da;
      });
      nodes.forEach(n => sortTree(n.replies));
    };

    sortTree(roots);
    return roots;
  };

  const commentTree = buildCommentTree(comments);

  // Real-time Threads
  useEffect(() => {
    const q = query(collection(db, "threads"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate()?.toLocaleTimeString() || "Just now"
      })) as any[];
      setThreads(threadsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "threads");
    });

    return unsubscribe;
  }, []);

  // Real-time Comments
  useEffect(() => {
    if (!selectedThread) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, `threads/${selectedThread.id}/comments`), 
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate()?.toLocaleTimeString() || "Just now"
      })) as any[];
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `threads/${selectedThread.id}/comments`);
    });

    return unsubscribe;
  }, [selectedThread?.id]);

  // Auth Handling
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
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
    });
    return unsub;
  }, []);

  // Fetch Profile Data
  useEffect(() => {
    if (!selectedProfileId) {
      setProfileData(null);
      setProfileThreads([]);
      setProfileComments([]);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);

    // 1. Get User Details (Real-time)
    const profileUnsub = onSnapshot(doc(db, "users", selectedProfileId), (snap) => {
      if (snap.exists()) {
        setProfileData(snap.data() as User);
        setIsProfileLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${selectedProfileId}`);
    });

    // 2. Get User's Threads
    const threadsQ = query(
      collection(db, "threads"),
      where("author.id", "==", selectedProfileId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const threadsUnsub = onSnapshot(threadsQ, (snap) => {
      setProfileThreads(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        timestamp: d.data().createdAt?.toDate()?.toLocaleTimeString() || "Just now"
      })) as any[]);
    });

    return () => {
      profileUnsub();
      threadsUnsub();
    };
  }, [selectedProfileId]);

  const handleSignIn = async () => {
    onAuthOpen();
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setSelectedProfileId(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      if (authMode === "signup") {
        const res = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        await updateProfile(res.user, { displayName: authForm.name });
        
        const userData: User = {
          id: res.user.uid,
          name: authForm.name,
          role: "Researcher",
          avatar: undefined
        };
        await setDoc(doc(db, "users", res.user.uid), userData);
        setUser(userData);
      } else {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      }
      setShowAuthModal(false);
      setAuthForm({ email: "", password: "", name: "" });
    } catch (error: any) {
      const msg = parseErrorMessage(error);
      setAuthError(msg);
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setIsSuccess(false);
    try {
      const userRef = doc(db, "users", user.id);
      const updatedUser = {
        name: editForm.name,
        avatar: editForm.avatar,
        role: editForm.role
      };

      // 1. Update User Document
      await updateDoc(userRef, updatedUser);

      // 2. Sync with existing threads (Denormalization sync)
      const threadsQ = query(collection(db, "threads"), where("author.id", "==", user.id));
      const threadsSnap = await getDocs(threadsQ);
      const batchPromises = threadsSnap.docs.map(tDoc => 
        updateDoc(doc(db, "threads", tDoc.id), {
          author: { ...user, ...updatedUser }
        })
      );
      await Promise.all(batchPromises);

      setUser({ ...user, ...updatedUser });
      setIsSuccess(true);
      showToast("Profile synchronized successfully.", "success");
      
      // Delay closing to show success state
      setTimeout(() => {
        setIsEditingProfile(false);
        setIsSuccess(false);
      }, 1500);
    } catch (error: any) {
      const msg = parseErrorMessage(error);
      showToast(msg);
      console.error("Profile update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThreadVote = async (id: string, delta: number) => {
    if (!user) return handleSignIn();
    try {
      const threadRef = doc(db, "threads", id);
      await updateDoc(threadRef, {
        upvotes: increment(delta)
      });
    } catch (error: any) {
      showToast(parseErrorMessage(error));
    }
  };

  const handleCommentVote = async (commentId: string, delta: number) => {
    if (!user || !selectedThread) return handleSignIn();
    try {
      const commentRef = doc(db, `threads/${selectedThread.id}/comments`, commentId);
      await updateDoc(commentRef, {
        upvotes: increment(delta)
      });
    } catch (error: any) {
      showToast(parseErrorMessage(error));
    }
  };

  const submitComment = async (parentId?: string) => {
    if (!user || !selectedThread || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const path = `threads/${selectedThread.id}/comments`;
      const commentData: any = {
        text: newComment,
        author: user,
        createdAt: serverTimestamp(),
        upvotes: 0
      };
      if (parentId) {
        commentData.parentId = parentId;
      }
      await addDoc(collection(db, path), commentData);
      
      // Increment thread comment count
      await updateDoc(doc(db, "threads", selectedThread.id), {
        commentCount: increment(1)
      });
      setNewComment("");
      setReplyingTo(null);
      showToast("Intelligence contribution registered.", "success");
    } catch (error: any) {
      showToast(parseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const createThread = async (title: string, description: string, category: string) => {
    if (!user) return handleSignIn();
    try {
      await addDoc(collection(db, "threads"), {
        title,
        description,
        category,
        author: user,
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentCount: 0,
        tags: ["Analysis"]
      });
        setIsCreating(false);
        showToast("Discussion thread initiated.", "success");
      } catch (error: any) {
        showToast(parseErrorMessage(error));
      }
    };

  const handleDeleteThread = async (threadId: string) => {
    if (!user || !window.confirm("ARE YOU SURE? THIS PURGE CANNOT BE UNDONE. ALL DATA WILL BE WIPED.")) return;
    
    setIsSubmitting(true);
    try {
      // 1. Fetch all comments in subcollection
      const commentsRef = collection(db, `threads/${threadId}/comments`);
      const snapshot = await getDocs(query(commentsRef));
      
      const batch = writeBatch(db);
      
      // 2. Add comment deletions to batch
      snapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });
      
      // 3. Add thread deletion to batch
      batch.delete(doc(db, "threads", threadId));
      
      // 4. Commit purge
      await batch.commit();
      
      setSelectedThread(null);
      showToast("Intelligence thread purged from central node.", "success");
    } catch (error: any) {
      showToast(parseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: any, depth?: number }) => (
    <div className={cn("space-y-4", depth > 0 && "ml-8 pl-8 border-l border-white/5")}>
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card rounded-2xl p-8 space-y-4" 
        role="comment"
      >
        <div className="flex items-start justify-between">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedProfileId(comment.author?.id)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:border-white/30 transition-all overflow-hidden" 
                aria-hidden="true"
              >
                 {comment.author?.avatar ? (
                   <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <UserIcon className="w-4 h-4 text-white/40" />
                 )}
              </button>
              <button onClick={() => setSelectedProfileId(comment.author?.id)} className="text-left">
                 <div className="text-sm font-medium hover:text-blue-400 transition-colors">{comment.author?.name}</div>
                 <div className="text-[10px] text-white/30 uppercase font-mono tracking-tighter">{comment.author?.role}</div>
              </button>
           </div>
           <div className="text-[10px] text-white/20 font-mono uppercase">{comment.timestamp}</div>
        </div>
        <p className="text-sm font-light text-white/70 leading-relaxed">
           {comment.text}
        </p>
        <div className="flex items-center gap-4 text-xs text-white/30">
           <div className="flex items-center gap-1">
             <button onClick={() => handleCommentVote(comment.id, 1)} className="hover:text-white transition-colors">
               <ArrowBigUp className="w-4 h-4" />
             </button>
             {comment.upvotes}
             <button onClick={() => handleCommentVote(comment.id, -1)} className="hover:text-white transition-colors">
               <ArrowBigDown className="w-4 h-4" />
             </button>
           </div>
           {user && depth < 3 && (
             <button 
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="hover:text-white transition-colors"
             >
               Reply
             </button>
           )}
        </div>

        {replyingTo === comment.id && (
          <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
             <textarea
               value={newComment}
               onChange={(e) => setNewComment(e.target.value)}
               autoFocus
               placeholder="Write a nested review..."
               className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px] resize-none"
             />
             <div className="flex justify-end gap-3">
               <button
                 onClick={() => setReplyingTo(null)}
                 className="text-white/40 hover:text-white text-xs"
               >
                 Cancel
               </button>
               <button
                 onClick={() => submitComment(comment.id)}
                 disabled={isSubmitting || !newComment.trim()}
                 className="bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
               >
                 {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : "Post Reply"}
               </button>
             </div>
          </div>
        )}
      </motion.div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply: any) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  const filteredThreads = threads.filter(thread => {
    const query = searchQuery.toLowerCase();
    return (
      thread.title.toLowerCase().includes(query) ||
      thread.description.toLowerCase().includes(query) ||
      thread.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen pt-40 pb-32 px-6 md:px-16 max-w-screen-2xl mx-auto relative z-10">
      <div className="ambient-glow top-0 right-1/4 w-[800px] h-[800px] bg-purple-500/5 opacity-10" />

      <AnimatePresence mode="wait">
        {selectedProfileId ? (
          /* Profile View */
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedProfileId(null)}
              className="text-label-caps text-white/40 hover:text-white flex items-center gap-2 transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Back to Activity
            </button>

            {isProfileLoading ? (
              /* Profile Skeleton Loader */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
                <div className="lg:col-span-4 space-y-6">
                  <div className="glass-card rounded-3xl p-8 space-y-6 text-center">
                    <div className="w-32 h-32 rounded-full bg-white/5 mx-auto" />
                    <div className="space-y-2">
                      <div className="h-8 w-32 bg-white/5 rounded mx-auto" />
                      <div className="h-4 w-24 bg-white/5 rounded mx-auto" />
                    </div>
                    <div className="h-10 w-full bg-white/5 rounded-xl" />
                  </div>
                  <div className="glass-card rounded-2xl p-6 h-32 bg-white/5" />
                </div>
                <div className="lg:col-span-8 space-y-8">
                  <div className="h-6 w-48 bg-white/5 rounded" />
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="glass-card rounded-2xl p-6 h-32 bg-white/5" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-card rounded-3xl p-8 space-y-6 text-center">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden mx-auto">
                      {profileData?.avatar ? (
                        <img src={profileData.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-12 h-12 text-white/20" />
                      )}
                    </div>
                    {user?.id === selectedProfileId && (
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-black hover:bg-blue-600 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-thin">{profileData?.name}</h2>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3" />
                      {profileData?.role}
                    </div>
                  </div>

                  {user?.id === selectedProfileId && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-light hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="text-label-caps text-white/30 text-xs">Technical Activity</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-2xl font-thin mb-1">{profileThreads.length}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-widest">Threads</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-2xl font-thin mb-1">...</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-widest">Reviews</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <section className="space-y-6">
                  <h3 className="text-label-caps text-white/40">Recent Intel Contributions</h3>
                  <div className="space-y-4">
                    {profileThreads.length === 0 ? (
                      <div className="text-center py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-3xl">
                        <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-4" />
                        <p className="text-sm text-white/20 font-light">No historical data found for this agent.</p>
                      </div>
                    ) : (
                      profileThreads.map(thread => (
                        <div 
                          key={thread.id} 
                          onClick={() => {
                            setSelectedThread(thread);
                            setSelectedProfileId(null);
                          }}
                          className="glass-card rounded-2xl p-6 hover:bg-white/[0.05] transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-blue-400 uppercase">{thread.category}</span>
                            <span className="text-[10px] text-white/20 uppercase">{thread.timestamp}</span>
                          </div>
                          <h4 className="text-white/80 group-hover:text-white transition-colors mb-2">{thread.title}</h4>
                          <div className="flex gap-4 text-[10px] text-white/40">
                             <div className="flex items-center gap-1">
                               <ArrowBigUp className="w-3 h-3" /> {thread.upvotes}
                             </div>
                             <div className="flex items-center gap-1">
                               <MessageSquare className="w-3 h-3" /> {thread.commentCount} comments
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Edit Profile Modal */}
            <AnimatePresence>
              {isEditingProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsEditingProfile(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-thin tracking-widest text-white/80">SYNCHRONIZE PROFILE</h3>
                      <button onClick={() => setIsEditingProfile(false)} className="text-white/20 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest ml-1 font-mono">Cognitive ID (Name)</label>
                        <input 
                          type="text" 
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Agent Identity"
                          className={cn(
                            "w-full bg-white/5 border rounded-xl p-4 text-sm font-light focus:outline-none focus:ring-1 transition-all",
                            !editForm.name.trim() ? "border-red-500/30 focus:ring-red-500/50" : "border-white/10 focus:ring-blue-500/50"
                          )}
                        />
                        {!editForm.name.trim() && (
                          <p className="text-[9px] text-red-500/60 uppercase tracking-widest ml-1 font-mono">Cognitive ID required for system sync</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest ml-1 font-mono">Intelligence Tier (Role)</label>
                        <select 
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none"
                        >
                          <option value="Researcher" className="bg-[#0A0A0A]">Researcher</option>
                          <option value="Expert" className="bg-[#0A0A0A]">Expert</option>
                          <option value="Admin" className="bg-[#0A0A0A]">Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase tracking-widest ml-1 font-mono">Neural Avatar (URL)</label>
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={editForm.avatar}
                          onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 py-4 bg-white/5 rounded-xl text-sm font-light hover:bg-white/10 transition-all border border-white/5"
                        disabled={isSubmitting}
                      >
                        Abort
                      </button>
                      <button 
                        onClick={handleUpdateProfile}
                        disabled={isSubmitting || isSuccess || !editForm.name.trim()}
                        className={cn(
                          "flex-1 py-4 rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 flex items-center justify-center gap-2",
                          isSuccess ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Syncing...
                          </>
                        ) : isSuccess ? (
                          <>
                            <Check className="w-4 h-4" /> Synchronized
                          </>
                        ) : (
                          "Synchronize"
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : !selectedThread ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
            role="main"
          >
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-10 mb-24 text-center lg:text-left">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-[72px] font-thin leading-none tracking-tighter" id="hub-title">Research Hub</h2>
                <p className="text-sm md:text-base text-white/30 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed text-balance">The world's first multi-agent adversarial network for peer-review and intelligence synthesis.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                <div className="flex items-center gap-3">
                  {!user ? (
                    <button 
                      onClick={onAuthOpen}
                      className="px-8 py-3 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm font-light flex items-center gap-3"
                    >
                      <LogIn className="w-4 h-4" /> Sign In
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 glass-card px-5 py-2.5 rounded-2xl border border-white/10">
                      <button 
                        onClick={() => {
                          setSelectedProfileId(user.id);
                          setEditForm({ 
                            name: user.name, 
                            avatar: user.avatar || "",
                            role: user.role
                          });
                        }}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-white/40" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-[10px] text-white/20 uppercase tracking-widest font-mono mb-0.5 leading-none">Agent Profile</div>
                          <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors truncate max-w-[120px]">{user.name}</span>
                        </div>
                      </button>
                      <div className="w-[1px] h-6 bg-white/10 mx-3" />
                      <button 
                        onClick={handleSignOut}
                        className="p-2 text-white/20 hover:text-red-400 transition-colors"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-72 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" aria-hidden="true" />
                  <label htmlFor="thread-search" className="sr-only">Search Discussions</label>
                  <input 
                    id="thread-search"
                    type="text" 
                    placeholder="Search neural threads..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-white text-black px-8 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-white/90 transition-all text-sm w-full sm:w-auto justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  aria-label="Start a new discussion thread"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> Discussion
                </button>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Sidebar Stats */}
              <div className="hidden lg:block lg:col-span-3 space-y-6" aria-label="Network Vital Stats">
                <div className="glass-card rounded-2xl p-6 space-y-6">
                  <div className="text-label-caps text-white/30">Network Status</div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-light text-white/60">Active Nodes</span>
                      <span className="text-xs font-mono">1.2k</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-light text-white/60">Verifications/hr</span>
                      <span className="text-xs font-mono text-blue-400">428</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <div className="text-label-caps text-white/30">Trending Contexts</div>
                  <div className="flex flex-wrap gap-2" role="list">
                    {["Election Integrity", "AI Safety", "Propaganda", "Blockchain"].map(tag => (
                      <span key={tag} role="listitem" className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-white/40 border border-white/5 uppercase font-mono">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Thread List */}
              <div className="lg:col-span-9 space-y-4" role="list" aria-labelledby="hub-title">
                {filteredThreads.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-3xl">
                    <Search className="w-8 h-8 text-white/10 mx-auto mb-4" />
                    <p className="text-sm text-white/20 font-light">No neural threads match your search parameters.</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                  <motion.div
                    key={thread.id}
                    layoutId={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedThread(thread);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Discussion Thread: ${thread.title} by ${thread.author.name}`}
                    className="glass-card rounded-2xl p-6 group cursor-pointer hover:bg-white/[0.05] transition-all border-white/5 hover:border-white/10 outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <div className="flex gap-6">
                      <div className="flex flex-col items-center gap-1 bg-white/5 rounded-xl p-2 h-fit" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleThreadVote(thread.id, 1); }}
                          aria-label="Upvote thread"
                          className="hover:text-white text-white/30 transition-colors"
                        >
                          <ArrowBigUp className="w-5 h-5" />
                        </button>
                        <span className="text-xs font-mono font-medium" aria-label={`${thread.upvotes} upvotes`}>{thread.upvotes}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleThreadVote(thread.id, -1); }}
                          aria-label="Downvote thread"
                          className="hover:text-white text-white/30 transition-colors"
                        >
                          <ArrowBigDown className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">{thread.category}</span>
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span className="text-[10px] text-white/20 uppercase font-mono">{thread.timestamp}</span>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-lg font-light group-hover:text-white transition-colors">{thread.title}</h3>
                          <p className="text-sm text-white/40 font-light line-clamp-2">{thread.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedProfileId(thread.author.id); }}
                              className="flex items-center gap-2 group"
                            >
                               <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-white/30 transition-all">
                                  {thread.author.avatar ? (
                                    <img src={thread.author.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <UserIcon className="w-3 h-3 text-white/40" />
                                  )}
                               </div>
                               <span className="text-xs text-white/60 font-light group-hover:text-white transition-colors">{thread.author.name}</span>
                            </button>
                            <div className="flex items-center gap-1 text-white/30 text-xs">
                              <MessageSquare className="w-3 h-3" /> {thread.commentCount}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {thread.tags.map(tag => (
                              <span key={tag} className="text-[10px] text-white/20 font-mono italic">#{tag}</span>
                            ))}
                            <ChevronRight className="w-4 h-4 text-white/10 group-hover:translate-x-1 group-hover:text-white/40 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Thread Detail View */
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
            role="article"
            aria-labelledby="thread-detail-title"
          >
            <button 
              onClick={() => setSelectedThread(null)}
              className="text-label-caps text-white/40 hover:text-white flex items-center gap-2 transition-colors group"
              aria-label="Back to research hub"
            >
              <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
              Return to Hub
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-10">
                 <div className="glass-card rounded-3xl p-8 md:p-12 space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">{selectedThread.category}</span>
                        <span className="text-xs text-white/30 flex items-center gap-2">
                          • Submitted {selectedThread.timestamp} by 
                          <button 
                            onClick={() => setSelectedProfileId(selectedThread.author.id)}
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                          >
                             <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                                {selectedThread.author.avatar ? (
                                  <img src={selectedThread.author.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="w-2.5 h-2.5 text-white/40" />
                                )}
                             </div>
                             {selectedThread.author.name}
                          </button>
                        </span>
                      </div>
                      {user?.id === selectedThread.author.id && (
                        <button 
                          onClick={() => handleDeleteThread(selectedThread.id)}
                          disabled={isSubmitting}
                          className="text-[10px] font-mono text-red-500/40 hover:text-red-500 transition-colors flex items-center gap-2 tracking-widest uppercase"
                          aria-label="Delete your thread"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Purge Protocol
                        </button>
                      )}
                    </div>
                    <h2 id="thread-detail-title" className="text-2xl md:text-3xl font-thin leading-tight">{selectedThread.title}</h2>
                    <p className="text-base md:text-lg font-light text-white/60 leading-relaxed">{selectedThread.description}</p>
                    
                    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                       <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-2" role="group" aria-label="Voting">
                          <button 
                            className="text-white/40 hover:text-white"
                            aria-label="Upvote this thread"
                            onClick={() => handleThreadVote(selectedThread.id, 1)}
                          >
                            <ArrowBigUp className="w-6 h-6" aria-hidden="true" />
                          </button>
                          <span className="font-mono text-lg" aria-label={`${selectedThread.upvotes} upvotes`}>{selectedThread.upvotes}</span>
                          <button 
                            className="text-white/40 hover:text-white"
                            aria-label="Downvote this thread"
                            onClick={() => handleThreadVote(selectedThread.id, -1)}
                          >
                            <ArrowBigDown className="w-6 h-6" aria-hidden="true" />
                          </button>
                       </div>
                       <button 
                        onClick={() => document.getElementById('main-comment-input')?.focus()}
                        className="flex items-center gap-2 text-white/40 hover:text-white text-sm"
                        aria-label="Post a reply to this thread"
                       >
                        <MessageSquare className="w-4 h-4" aria-hidden="true" /> Reply
                       </button>
                    </div>
                 </div>

                 <section className="space-y-6" aria-label="Comment technical reviews">
                    <div className="flex items-center justify-between">
                       <h3 className="text-label-caps text-white/40">Technical Review Feed</h3>
                       <div className="flex items-center gap-2 text-xs text-white/30" role="status">
                          <Filter className="w-3 h-3" aria-hidden="true" /> Best Reviews
                       </div>
                    </div>

                     {/* Comment Input */}
                     {user && (
                       <div className="glass-card rounded-2xl p-6 space-y-4">
                         <textarea
                           id="main-comment-input"
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           placeholder="Analyze this intelligence..."
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px] resize-none"
                         />
                         <div className="flex justify-end">
                           <button
                             onClick={() => submitComment()}
                             disabled={isSubmitting || !newComment.trim()}
                             className="bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                           >
                             {isSubmitting ? (
                               <>
                                 <Loader2 className="w-4 h-4 animate-spin" />
                                 Submitting...
                               </>
                             ) : "Post Review"}
                           </button>
                         </div>
                       </div>
                     )}                      <div className="space-y-8">
                         {comments.length === 0 && !isSubmitting && (
                           <div className="text-center py-12 text-white/20 font-light border border-white/5 border-dashed rounded-2xl">
                              No technical reviews found for this node.
                           </div>
                         )}
                         {commentTree.map(comment => (
                           <CommentItem key={comment.id} comment={comment} />
                         ))}
                      </div>
                 </section>
              </div>

              <aside className="lg:col-span-4 space-y-8">
                 <section className="glass-card rounded-2xl p-10 space-y-8" aria-labelledby="context-title">
                    <div id="context-title" className="text-label-caps text-white/30">Thread Context</div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                          <ShieldCheck className="w-5 h-5 text-blue-400" aria-hidden="true" />
                          <div className="text-xs font-light">Verified Intelligence</div>
                       </div>
                    </div>
                 </section>

                 <section className="glass-card rounded-2xl p-8 space-y-6" aria-labelledby="related-title">
                    <div id="related-title" className="text-label-caps text-white/30">Related Entities</div>
                    <div className="space-y-3" role="list">
                       {selectedThread.tags.map(tag => (
                         <div key={tag} role="listitem" className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-all cursor-pointer group">
                            <span className="text-sm font-light text-white/60 group-hover:text-white transition-colors">{tag}</span>
                            <TrendingUp className="w-3 h-3 text-white/20 group-hover:text-blue-400 transition-colors" />
                         </div>
                       ))}
                    </div>
                  </section>
               </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4"
          >
            <div className={cn(
              "glass-card rounded-2xl p-4 flex items-center gap-4 border shadow-2xl",
              toast.type === "error" ? "border-red-500/20 bg-red-500/5" : "border-green-500/20 bg-green-500/5"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                toast.type === "error" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
              )} />
              <div className="flex-1 text-sm font-light text-white/80">
                <span className="text-[10px] block uppercase tracking-widest text-white/30 font-mono mb-1">
                  {toast.type === "error" ? "System Alert" : "System Notification"}
                </span>
                {toast.message}
              </div>
              <button 
                onClick={() => setToast(null)}
                className="text-white/20 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
