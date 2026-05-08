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
  LogIn
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
  serverTimestamp, 
  increment,
  limit 
} from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const MOCK_USER: User = {
  id: "u1",
  name: "Dr. Aris Thorne",
  role: "Expert",
};

const INITIAL_THREADS: Thread[] = [
  {
    id: "t1",
    title: "Anomalous patterns in recent climate policy reports",
    description: "Deep dive into the linguistic discrepancies found in the recent EU climate draft. The sentiment analysis suggests significant lobbying influence.",
    category: "Analysis Review",
    author: { id: "u2", name: "Sarah Chen", role: "Researcher" },
    timestamp: "2h ago",
    upvotes: 245,
    commentCount: 42,
    tags: ["Climate", "Lobbying", "Semantic Shift"],
    comments: [],
  },
  {
    id: "t2",
    title: "Deepfake detection: Neural artifacts in late-2025 samples",
    description: "We are seeing a new class of GAN-generated artifacts. Alitheia's core is flagging them as 0.98 probability manipulations.",
    category: "Methodology",
    author: { id: "u1", name: "Dr. Aris Thorne", role: "Expert" },
    timestamp: "5h ago",
    upvotes: 890,
    commentCount: 128,
    tags: ["Deepfake", "Neural Nets", "Forensics"],
    comments: [],
  },
  {
    id: "t3",
    title: "The role of emotional intensity in virality prediction",
    description: "Discussion on how sensationalism serves as a primary marker for coordinated inauthentic behavior.",
    category: "General",
    author: { id: "u3", name: "Marcus Vane", role: "Researcher" },
    timestamp: "12h ago",
    upvotes: 112,
    commentCount: 18,
    tags: ["Psychology", "Viral Dynamics"],
    comments: [],
  }
];

export default function Community() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "Anonymous Agent",
          role: "Researcher",
          avatar: firebaseUser.photoURL || undefined
        });
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Sign in failed:", e);
    }
  };

  const handleThreadVote = async (id: string, delta: number) => {
    if (!user) return handleSignIn();
    try {
      const threadRef = doc(db, "threads", id);
      await updateDoc(threadRef, {
        upvotes: increment(delta)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `threads/${id}`);
    }
  };

  const handleCommentVote = async (commentId: string, delta: number) => {
    if (!user || !selectedThread) return handleSignIn();
    try {
      const commentRef = doc(db, `threads/${selectedThread.id}/comments`, commentId);
      await updateDoc(commentRef, {
        upvotes: increment(delta)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `threads/${selectedThread.id}/comments/${commentId}`);
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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `threads/${selectedThread.id}/comments`);
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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "threads");
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: any, depth?: number }) => (
    <div className={cn("space-y-4", depth > 0 && "ml-4 md:ml-8 pl-4 md:pl-8 border-l border-white/5")}>
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card rounded-2xl p-6 sm:p-8 space-y-4" 
        role="comment"
      >
        <div className="flex items-start justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10" aria-hidden="true">
                 {comment.author?.avatar ? (
                   <img src={comment.author.avatar} alt="" className="w-full h-full rounded-full" />
                 ) : (
                   <UserIcon className="w-4 h-4 text-white/40" />
                 )}
              </div>
              <div>
                 <div className="text-sm font-medium">{comment.author?.name}</div>
                 <div className="text-[10px] text-white/30 uppercase font-mono tracking-tighter">{comment.author?.role}</div>
              </div>
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
                 {isSubmitting ? "Posting..." : "Post Reply"}
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

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 max-w-7xl mx-auto relative z-10">
      <div className="ambient-glow top-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 opacity-10" />

      <AnimatePresence mode="wait">
        {!selectedThread ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
            role="main"
          >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <h2 className="text-display-xl font-thin text-[56px]" id="hub-title">Research Hub</h2>
                <p className="text-white/40 font-light max-w-md">Global peer-review and adversarial intelligence synthesis.</p>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                {!user && (
                  <button 
                    onClick={handleSignIn}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm px-4"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                )}
                <div className="flex-1 md:w-64 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" aria-hidden="true" />
                  <label htmlFor="thread-search" className="sr-only">Search Discussions</label>
                  <input 
                    id="thread-search"
                    type="text" 
                    placeholder="Filter intelligence..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-white/90 transition-all text-sm"
                  aria-label="Start a new discussion thread"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" /> Start Discussion
                </button>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                {threads.map((thread) => (
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
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                  <UserIcon className="w-3 h-3 text-white/40" />
                               </div>
                               <span className="text-xs text-white/60 font-light">{thread.author.name}</span>
                            </div>
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
                ))}
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                 <div className="glass-card rounded-3xl p-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">{selectedThread.category}</span>
                      <span className="text-xs text-white/30">• Submitted {selectedThread.timestamp} by {selectedThread.author.name}</span>
                    </div>
                    <h2 id="thread-detail-title" className="text-3xl font-thin leading-tight">{selectedThread.title}</h2>
                    <p className="text-lg font-light text-white/60 leading-relaxed">{selectedThread.description}</p>
                    
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
                             className="bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                           >
                             {isSubmitting ? "Submitting..." : "Post Review"}
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

              <aside className="lg:col-span-4 space-y-6">
                 <section className="glass-card rounded-2xl p-8 space-y-6" aria-labelledby="context-title">
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
    </div>
  );
}
