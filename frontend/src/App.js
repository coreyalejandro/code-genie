import React, { useState, useEffect, useRef } from 'react';
import { Upload, Mic, Code, FileText, Image, Play, Copy, Download, Loader2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LANGUAGE_OPTIONS = [
  { key: 'python', name: 'Python', icon: '🐍' },
  { key: 'javascript', name: 'JavaScript', icon: '🟨' },
  { key: 'java', name: 'Java', icon: '☕' },
  { key: 'cpp', name: 'C++', icon: '⚡' },
  { key: 'csharp', name: 'C#', icon: '🔷' },
  { key: 'go', name: 'Go', icon: '🐹' },
  { key: 'rust', name: 'Rust', icon: '🦀' },
  { key: 'typescript', name: 'TypeScript', icon: '🔷' },
  { key: 'swift', name: 'Swift', icon: '🍎' },
  { key: 'kotlin', name: 'Kotlin', icon: '🟣' }
];

// Dynamic examples that rotate
const EXAMPLE_PROMPTS = [
  {
    category: "Sorting Algorithms",
    examples: [
      "Create a function that sorts an array using bubble sort algorithm",
      "Implement quicksort algorithm to sort numbers in ascending order",
      "Build a merge sort function that divides and conquers an array",
      "Design an insertion sort algorithm for small datasets",
      "Create a heap sort implementation for efficient sorting"
    ]
  },
  {
    category: "Search Algorithms", 
    examples: [
      "Implement binary search to find an element in a sorted array",
      "Create a linear search function to find a value in an unsorted list",
      "Build a depth-first search algorithm for tree traversal",
      "Design breadth-first search for finding shortest path in a graph",
      "Implement hash table search with collision handling"
    ]
  },
  {
    category: "Data Structures",
    examples: [
      "Create a stack data structure with push, pop, and peek operations",
      "Implement a queue with enqueue and dequeue functionality",
      "Build a binary tree with insert, delete, and search methods",
      "Design a linked list with add, remove, and traverse operations",
      "Create a hash map with dynamic resizing capabilities"
    ]
  },
  {
    category: "Mathematical Algorithms",
    examples: [
      "Calculate factorial of a number using recursion and iteration",
      "Generate Fibonacci sequence up to n terms using dynamic programming",
      "Find the greatest common divisor (GCD) using Euclidean algorithm",
      "Implement prime number checker using sieve of Eratosthenes",
      "Create a function to calculate power of a number efficiently"
    ]
  },
  {
    category: "String Processing",
    examples: [
      "Check if a string is a palindrome ignoring case and spaces",
      "Find all anagrams of a word in a list of strings",
      "Implement string pattern matching using KMP algorithm",
      "Create a function to reverse words in a sentence",
      "Build a text compression algorithm using character frequency"
    ]
  },
  {
    category: "Web Development",
    examples: [
      "Create a REST API endpoint that handles user authentication",
      "Build a responsive navigation menu with dropdown functionality",
      "Implement form validation with error handling and user feedback",
      "Design a shopping cart system with add, remove, and total calculation",
      "Create a real-time chat application with WebSocket connections"
    ]
  },
  {
    category: "Game Development",
    examples: [
      "Create a tic-tac-toe game with win condition checking",
      "Implement a rock-paper-scissors game with score tracking",
      "Build a number guessing game with hints and attempts counter",
      "Design a simple 2D collision detection system",
      "Create a maze generator using recursive backtracking"
    ]
  }
];

// Function to get a random example
const getRandomExample = () => {
  const allExamples = EXAMPLE_PROMPTS.flatMap(category => 
    category.examples.map(example => ({
      text: example,
      category: category.category
    }))
  );
  return allExamples[Math.floor(Math.random() * allExamples.length)];
};

function App() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [activeTab, setActiveTab] = useState('input');
  const [inputType, setInputType] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeAnalysisInput, setCodeAnalysisInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [currentExample, setCurrentExample] = useState(() => getRandomExample());
  
  // Chat functionality
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState([]);
  
  // Local Authentication & Persistent Storage
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [localAccounts, setLocalAccounts] = useState([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const flowchartRef = useRef(null);

  // Local Storage Management
  const LOCAL_STORAGE_KEYS = {
    ACCOUNTS: 'codeGenie_accounts',
    CURRENT_USER: 'codeGenie_current_user',
    USER_DATA_PREFIX: 'codeGenie_user_'
  };

  // Initialize local accounts and current user on component mount
  useEffect(() => {
    try {
      // Load existing accounts
      const accounts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.ACCOUNTS) || '[]');
      setLocalAccounts(accounts);
      
      // Load current user if exists
      const currentUserData = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        setCurrentUser(user);
        loadUserData(user.username);
      }
    } catch (error) {
      console.error('Error loading local user data:', error);
    }
  }, []);

  const loadUserData = (username) => {
    try {
      const userData = localStorage.getItem(`${LOCAL_STORAGE_KEYS.USER_DATA_PREFIX}${username}`);
      if (userData) {
        const parsedData = JSON.parse(userData);
        // Restore user-specific data
        setUserProfile(parsedData.profile || null);
        setChatHistory(parsedData.chatHistory || []);
        setPersonalizedSuggestions(parsedData.personalizedSuggestions || []);
        // Note: We don't restore result/analysisResult as they should be fresh per session
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserData = (username, data) => {
    try {
      const existingData = JSON.parse(
        localStorage.getItem(`${LOCAL_STORAGE_KEYS.USER_DATA_PREFIX}${username}`) || '{}'
      );
      
      const updatedData = {
        ...existingData,
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(
        `${LOCAL_STORAGE_KEYS.USER_DATA_PREFIX}${username}`,
        JSON.stringify(updatedData)
      );
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const createLocalAccount = (username, avatar = '🧑‍💻') => {
    try {
      const newAccount = {
        username,
        avatar,
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      const updatedAccounts = [...localAccounts, newAccount];
      setLocalAccounts(updatedAccounts);
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
      
      // Set as current user
      setCurrentUser(newAccount);
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newAccount));
      
      // Initialize empty user data
      saveUserData(username, {
        profile: null,
        chatHistory: [],
        personalizedSuggestions: [],
        created: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error creating account:', error);
      return false;
    }
  };

  const loginToAccount = (username) => {
    try {
      const account = localAccounts.find(acc => acc.username === username);
      if (account) {
        const updatedAccount = { ...account, lastLogin: new Date().toISOString() };
        
        // Update account in list
        const updatedAccounts = localAccounts.map(acc => 
          acc.username === username ? updatedAccount : acc
        );
        setLocalAccounts(updatedAccounts);
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));
        
        // Set as current user
        setCurrentUser(updatedAccount);
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedAccount));
        
        // Load user data
        loadUserData(username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  };

  const logoutUser = () => {
    try {
      // Save current data before logout
      if (currentUser) {
        saveUserData(currentUser.username, {
          profile: userProfile,
          chatHistory,
          personalizedSuggestions
        });
      }
      
      // Clear current user
      setCurrentUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
      
      // Reset UI state
      setUserProfile(null);
      setChatHistory([]);
      setPersonalizedSuggestions([]);
      setShowChat(false);
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const exportUserData = () => {
    if (!currentUser) return;
    
    try {
      const userData = localStorage.getItem(`${LOCAL_STORAGE_KEYS.USER_DATA_PREFIX}${currentUser.username}`);
      const exportData = {
        account: currentUser,
        userData: userData ? JSON.parse(userData) : {},
        exportedAt: new Date().toISOString(),
        version: "1.0"
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CodeGenie_${currentUser.username}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Auto-save user data when it changes
  useEffect(() => {
    if (currentUser && (userProfile || chatHistory.length > 0 || personalizedSuggestions.length > 0)) {
      const timeoutId = setTimeout(() => {
        saveUserData(currentUser.username, {
          profile: userProfile,
          chatHistory,
          personalizedSuggestions
        });
      }, 1000); // Debounce saves
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentUser, userProfile, chatHistory, personalizedSuggestions]);

  // Get a new random example
  const getNewExample = () => {
    setCurrentExample(getRandomExample());
  };

  // Audio recording setup
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };
        })
        .catch(err => console.error('Error accessing microphone:', err));
    }
  }, []);

  // Display flowchart content (simplified approach - no Mermaid rendering)
  useEffect(() => {
    if (result && result.flowchart && flowchartRef.current) {
      try {
        // Clear previous content
        flowchartRef.current.innerHTML = '';
        
        // Clean the flowchart content
        let flowchartContent = result.flowchart.trim();
        
        // Remove markdown code blocks
        flowchartContent = flowchartContent
          .replace(/```mermaid\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
          .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
          .trim();
        
        console.log('Flowchart content:', flowchartContent);
        
        // Create a clean display
        const displayDiv = document.createElement('div');
        displayDiv.className = 'p-4 bg-slate-900 rounded';
        displayDiv.innerHTML = `
          <div class="mb-3 flex items-center text-blue-400">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3 6 3v8.764a1 1 0 01-.553.894L21 20l-6-3-6 3z"></path>
            </svg>
            <span class="font-medium">AI-Generated Flowchart</span>
          </div>
          <div class="bg-slate-800 p-3 rounded border-l-4 border-blue-500">
            <pre class="text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">${flowchartContent}</pre>
          </div>
          <div class="mt-3 text-xs text-slate-400 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Flowchart logic generated by AI - represents your algorithm's flow
          </div>
        `;
        
        flowchartRef.current.appendChild(displayDiv);
        
      } catch (error) {
        console.error('Error displaying flowchart:', error);
        if (flowchartRef.current) {
          flowchartRef.current.innerHTML = `
            <div class="text-slate-400 p-4 text-center bg-slate-900 rounded">
              <p class="font-medium">Flowchart Generated</p>
              <p class="text-sm mt-2">Check browser console for details</p>
            </div>
          `;
        }
      }
    }
  }, [result]);

  // File drop zone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        if (file.type.startsWith('image/')) {
          setInputType('image');
        } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          setInputType('audio');
        }
      }
    }
  });

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setUploadedFile(audioBlob);
        setInputType('audio');
      };
    }
  };

  const processInput = async (customText = null) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      let response;
      
      if (inputType === 'code_analysis') {
        // Handle code analysis only
        if (uploadedFile && uploadedFile.type === 'text/plain') {
          const formData = new FormData();
          formData.append('file', uploadedFile);
          formData.append('session_id', sessionId);
          
          response = await axios.post(`${API}/analyze-code-file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          const content = codeAnalysisInput;
          if (!content || content.trim() === '') {
            setError('Please provide code to analyze');
            setIsProcessing(false);
            return;
          }
          
          response = await axios.post(`${API}/analyze-code`, {
            session_id: sessionId,
            input_type: 'code_analysis',
            content: content
          });
        }
        
        setAnalysisResult(response.data);
        setActiveTab('analysis');
        
      } else if (inputType === 'image' && uploadedFile) {
        // Handle image upload
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('session_id', sessionId);
        formData.append('description', imageDescription);
        
        response = await axios.post(`${API}/process-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setResult(response.data);
        setActiveTab('results');
      } else {
        // Handle text, code, or audio input (original flow)
        let content;
        if (inputType === 'text') {
          content = customText || textInput;
        } else if (inputType === 'code') {
          content = codeInput;
        } else if (inputType === 'audio' && uploadedFile) {
          content = "Audio file uploaded - please implement speech-to-text conversion";
        }
        
        if (!content || content.trim() === '') {
          setError('Please provide some content to process');
          setIsProcessing(false);
          return;
        }
        
        response = await axios.post(`${API}/process`, {
          session_id: sessionId,
          input_type: inputType,
          content: content,
          description: inputType === 'image' ? imageDescription : null
        });
        
        setResult(response.data);
        setActiveTab('results');
      }
      
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.response?.data?.detail || 'An error occurred while processing your input');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          showCopyFeedback('✅ Copied to clipboard!');
        })
        .catch(() => {
          // Fallback to legacy method
          fallbackCopyToClipboard(text);
        });
    } else {
      // Use fallback method
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Try to copy using execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showCopyFeedback('✅ Copied to clipboard!');
      } else {
        showCopyFeedback('❌ Copy failed - please select and copy manually');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showCopyFeedback('❌ Copy not supported - please select and copy manually');
    }
  };

  const showCopyFeedback = (message) => {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1e293b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-size: 14px;
      border: 1px solid #334155;
    `;
    
    document.body.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 3000);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    
    setIsChatting(true);
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to history
    const newUserMessage = {
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, newUserMessage]);
    
    try {
      // Build context based on current tab
      let context = {};
      if (activeTab === 'results' && result) {
        context = {
          code: result.code_outputs[selectedLanguage],
          analysis: result.code_analysis
        };
      } else if (activeTab === 'analysis' && analysisResult) {
        context = {
          code: analysisResult.original_code,
          analysis: analysisResult.code_analysis
        };
      }
      
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: userMessage,
        context: context
      });
      
      // Add AI response to history
      const aiMessage = {
        type: 'ai',
        message: response.data.response,
        skill_level: response.data.skill_level,
        timestamp: response.data.timestamp
      };
      setChatHistory(prev => [...prev, aiMessage]);
      
      // Update user profile if skill level changed
      if (response.data.skill_level && (!userProfile || userProfile.skill_level !== response.data.skill_level)) {
        setUserProfile({ skill_level: response.data.skill_level });
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        type: 'error',
        message: 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const updateLearningProfile = async () => {
    try {
      let interactionData = {};
      let topic = 'programming';
      
      if (activeTab === 'results' && result) {
        interactionData = {
          code_quality_score: result.code_analysis?.quality_score,
          question_complexity: chatHistory.length > 0 ? 'intermediate' : 'basic',
          code_patterns: ['algorithm'] // Could be enhanced based on actual code analysis
        };
        topic = 'algorithms';
      } else if (activeTab === 'analysis' && analysisResult) {
        interactionData = {
          code_quality_score: analysisResult.code_analysis?.quality_score,
          question_complexity: 'advanced', // Analysis tab indicates more advanced usage
          code_patterns: ['code_analysis']
        };
        topic = 'code optimization';
      }
      
      const response = await axios.post(`${API}/learning-profile`, {
        session_id: sessionId,
        interaction_data: interactionData,
        topic: topic
      });
      
      setUserProfile({
        skill_level: response.data.skill_level,
        knowledge_gaps: response.data.knowledge_gaps,
        completed_concepts: response.data.completed_concepts
      });
      setPersonalizedSuggestions(response.data.personalized_suggestions);
      
    } catch (err) {
      console.error('Learning profile update error:', err);
    }
  };

  // Update learning profile when results are available
  useEffect(() => {
    if ((result || analysisResult) && sessionId) {
      updateLearningProfile();
    }
  }, [result, analysisResult, sessionId]);

  const downloadCode = (code, language) => {
    const extensions = {
      python: 'py', javascript: 'js', java: 'java', cpp: 'cpp',
      csharp: 'cs', go: 'go', rust: 'rs', typescript: 'ts',
      swift: 'swift', kotlin: 'kt'
    };
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extensions[language]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showChat ? 'mr-96' : 'mr-0'}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl mr-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-6xl font-bold text-white tracking-tight">
                Code <span className="text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">Genie</span>
              </h1>
              
              {/* User Account Section */}
              <div className="ml-6 flex items-center space-x-4">
                {currentUser ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowAccountMenu(!showAccountMenu)}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                    >
                      <span className="text-2xl">{currentUser.avatar}</span>
                      <div className="text-left">
                        <div className="text-white font-medium">{currentUser.username}</div>
                        {userProfile && (
                          <div className="text-xs text-slate-300 capitalize">{userProfile.skill_level} Level</div>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Account Menu */}
                    {showAccountMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20">
                        <div className="p-4 border-b border-slate-600">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{currentUser.avatar}</span>
                            <div>
                              <div className="text-white font-medium">{currentUser.username}</div>
                              <div className="text-xs text-slate-400">
                                Member since {new Date(currentUser.created).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => {
                              exportUserData();
                              setShowAccountMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-700 rounded flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Learning Data
                          </button>
                          <button
                            onClick={() => setShowAuthModal(true)}
                            className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-700 rounded flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4" />
                            </svg>
                            Switch Account
                          </button>
                          <button
                            onClick={logoutUser}
                            className="w-full text-left px-3 py-2 text-red-400 hover:bg-slate-700 rounded flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Create Account
                  </button>
                )}
              </div>
              
              {/* Chat Toggle Button */}
              {(result || analysisResult) && currentUser && (
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`ml-4 p-3 rounded-lg transition-all ${
                    showChat 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title={showChat ? 'Hide AI Tutor' : 'Ask AI Tutor'}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              )}
            </div>
            
            <p className="text-slate-300 text-xl max-w-3xl mx-auto mb-2">
              Your AI-powered multimodal coding assistant
            </p>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">
              Transform any input into pseudocode, flowcharts, and code in 10 programming languages
            </p>
            
            {/* Guest Mode Warning */}
            {!currentUser && (
              <div className="mt-6 max-w-2xl mx-auto p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <div className="flex items-center justify-center text-amber-400 text-sm">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Guest Mode: Your progress won't be saved. Create an account to enable persistent learning!
                </div>
              </div>
            )}
          </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800 rounded-lg p-1 flex space-x-1">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'input'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Input
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'results'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              disabled={!result}
            >
              <Code className="w-5 h-5 inline mr-2" />
              Results
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'analysis'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analysis
            </button>
          </div>
        </div>

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="max-w-4xl mx-auto">
            {/* Input Type Selection */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Choose Input Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { type: 'text', icon: FileText, label: 'Text Description' },
                  { type: 'code', icon: Code, label: 'Code Snippet' },
                  { type: 'code_analysis', icon: () => (
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ), label: 'Code Analysis' },
                  { type: 'image', icon: Image, label: 'Image/Diagram' },
                  { type: 'audio', icon: Mic, label: 'Voice/Audio' }
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setInputType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === type
                        ? type === 'code_analysis' 
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-600 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Content */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              {inputType === 'text' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-white font-medium">
                      Describe your algorithm or logic:
                    </label>
                    <button
                      onClick={getNewExample}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-500/10 transition-all flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      New Example
                    </button>
                  </div>
                  
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-blue-400 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {currentExample.category} Example
                      </div>
                      <button
                        onClick={() => {
                          setTextInput(currentExample.text);
                          // Pass the example text directly to processInput
                          processInput(currentExample.text);
                        }}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {isProcessing ? (
                          <>
                            <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 5a9 9 0 1118 0H3z" />
                            </svg>
                            Run Example
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-blue-200 text-sm leading-relaxed">{currentExample.text}</p>
                  </div>
                  
                  <div className="mb-3 p-3 bg-slate-800/50 border border-slate-600/50 rounded-lg">
                    <div className="flex items-center text-slate-400 text-sm font-medium mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Quick Start Instructions
                    </div>
                    <div className="text-slate-300 text-sm">
                      <span className="font-medium text-green-400">Option 1:</span> Click <span className="font-medium">"Run Example"</span> above to instantly see the AI in action
                      <br />
                      <span className="font-medium text-blue-400">Option 2:</span> Type your own algorithm description in the box below
                    </div>
                  </div>
                  
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={`Enter your own algorithm description here, or click "Run Example" above to try: "${currentExample.text}"`}
                    className="w-full h-32 bg-slate-700 text-white rounded-lg p-4 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <div className="mt-2 text-xs text-slate-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 12v1m9-9h-1M4 12H3m15.364-6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    💡 Describe any algorithm, data structure, or programming concept - the more specific, the better!
                  </div>
                </div>
              )}

              {inputType === 'code' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-white font-medium">
                      Paste your code:
                    </label>
                    <button
                      onClick={() => {
                        const codeExamples = [
                          `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
                          `function quickSort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[arr.length - 1];
    const left = [], right = [];
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) left.push(arr[i]);
        else right.push(arr[i]);
    }
    return [...quickSort(left), pivot, ...quickSort(right)];
}`,
                          `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
    
    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node`,
                          `public class BinarySearch {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`
                        ];
                        const randomCode = codeExamples[Math.floor(Math.random() * codeExamples.length)];
                        setCodeInput(randomCode);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-500/10 transition-all flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Sample Code
                    </button>
                  </div>
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste your code here... (Click 'Sample Code' for examples)"
                    className="w-full h-32 bg-slate-700 text-white rounded-lg p-4 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                  />
                  <div className="mt-2 text-xs text-slate-400">
                    💡 Paste any code in any language - the AI will analyze and convert it
                  </div>
                </div>
              )}

              {inputType === 'code_analysis' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-white font-medium">
                      Analyze your code:
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const analysisExamples = [
                            `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
                            `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}`,
                            `public class LinearSearch {
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }
}`
                          ];
                          const randomCode = analysisExamples[Math.floor(Math.random() * analysisExamples.length)];
                          setCodeAnalysisInput(randomCode);
                        }}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium px-3 py-1 rounded-md hover:bg-purple-500/10 transition-all flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Sample Code
                      </button>
                      <div
                        {...getRootProps()}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium px-3 py-1 rounded-md hover:bg-purple-500/10 transition-all flex items-center cursor-pointer"
                      >
                        <input {...getInputProps()} />
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload File
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center text-purple-400 text-sm font-medium mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Code Analysis
                    </div>
                    <ul className="text-purple-200 text-sm space-y-1">
                      <li>• Time & Space complexity analysis</li>
                      <li>• Code quality scoring</li>
                      <li>• Optimization suggestions</li>
                      <li>• Alternative approaches</li>
                      <li>• Learning insights for improvement</li>
                    </ul>
                  </div>
                  
                  {uploadedFile && uploadedFile.type === 'text/plain' ? (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="text-green-400 text-sm font-medium">File uploaded: {uploadedFile.name}</div>
                    </div>
                  ) : (
                    <textarea
                      value={codeAnalysisInput}
                      onChange={(e) => setCodeAnalysisInput(e.target.value)}
                      placeholder="Paste your code here for instant AI analysis..."
                      className="w-full h-40 bg-slate-700 text-white rounded-lg p-4 border border-slate-600 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
                    />
                  )}
                  
                  <div className="mt-2 text-xs text-slate-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    💡 Get instant AI analysis of your code - complexity, quality, and optimization tips
                  </div>
                </div>
              )}

              {inputType === 'image' && (
                <div>
                  <label className="block text-white font-medium mb-3">
                    Upload an image or diagram:
                  </label>
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center text-green-400 text-sm font-medium mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      What can you upload?
                    </div>
                    <ul className="text-green-200 text-sm space-y-1">
                      <li>• Flowcharts and diagrams</li>
                      <li>• Handwritten pseudocode or algorithms</li>
                      <li>• Screenshots of code or documentation</li>
                      <li>• Whiteboard drawings of logic flows</li>
                      <li>• UML diagrams or system architecture</li>
                    </ul>
                  </div>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-300 mb-2">
                      {uploadedFile ? uploadedFile.name : 'Drag & drop an image here, or click to select'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Supports PNG, JPG, GIF, and other image formats
                    </p>
                  </div>
                  {uploadedFile && uploadedFile.type.startsWith('image/') && (
                    <div className="mt-4">
                      <label className="block text-white font-medium mb-2">
                        Optional: Describe what's in the image:
                      </label>
                      <input
                        type="text"
                        value={imageDescription}
                        onChange={(e) => setImageDescription(e.target.value)}
                        placeholder="E.g., flowchart showing a sorting algorithm, handwritten pseudocode, UML diagram..."
                        className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {inputType === 'audio' && (
                <div>
                  <label className="block text-white font-medium mb-3">
                    Record or upload audio:
                  </label>
                  <div className="flex flex-col space-y-4">
                    <div className="flex space-x-4">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                          isRecording
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </button>
                    </div>
                    <div className="text-center text-slate-400">or</div>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-slate-300">
                        {uploadedFile ? uploadedFile.name : 'Upload audio file'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Process Button */}
            <div className="text-center">
              <button
                onClick={() => processInput()}
                disabled={isProcessing}
                className={`px-8 py-4 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  inputType === 'code_analysis'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                    {inputType === 'code_analysis' ? 'Analyzing Code...' : 'Processing with AI...'}
                  </>
                ) : (
                  <>
                    {inputType === 'code_analysis' ? (
                      <>
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Analyze Code
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 inline mr-2" />
                        Transform with AI
                      </>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Error:</span>
                </div>
                <p className="text-red-300 mt-1">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          analysisResult ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white">AI Code Analysis Results</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Time Complexity</div>
                    <div className="text-lg font-mono text-orange-400">{analysisResult.code_analysis.time_complexity}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Space Complexity</div>
                    <div className="text-lg font-mono text-blue-400">{analysisResult.code_analysis.space_complexity}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Quality Score</div>
                    <div className="flex items-center">
                      <div className="text-lg font-bold text-green-400 mr-2">{analysisResult.code_analysis.quality_score}/10</div>
                      <div className="flex">
                        {[...Array(10)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < analysisResult.code_analysis.quality_score ? 'text-green-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Optimizations
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.code_analysis.optimizations?.map((opt, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Alternative Approaches
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.code_analysis.alternatives?.map((alt, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg border border-green-500/20">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Learning Insights
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.code_analysis.learning_insights?.map((insight, i) => (
                      <li key={i} className="text-green-200 text-sm flex items-start">
                        <span className="text-green-400 mr-2">💡</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Original Code Display */}
                <div className="bg-slate-800 rounded-lg p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Analyzed Code</h3>
                    <button
                      onClick={() => copyToClipboard(analysisResult.original_code)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                    <code>{analysisResult.original_code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center text-slate-400">
              No analysis yet – run an analysis to see results
            </div>
          )
        )}

        {/* Results Tab */}
        {activeTab === 'results' && result && (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Pseudocode */}
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Pseudocode</h3>
                  <button
                    onClick={() => copyToClipboard(result.pseudocode)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap">
                  {result.pseudocode}
                </pre>
              </div>

              {/* Flowchart */}
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Flowchart</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(result.flowchart)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
                      title="Copy flowchart syntax"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <a
                      href="https://mermaid.live/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-all"
                      title="Open in Mermaid Live Editor"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
                <div 
                  ref={flowchartRef}
                  className="bg-slate-900 p-4 rounded-lg overflow-auto min-h-[300px] flex items-center justify-center"
                />
                <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI-generated flowchart logic - represents your algorithm's flow
                  </div>
                  <button
                    onClick={() => window.open('https://mermaid.live/', '_blank')}
                    className="text-blue-400 hover:text-blue-300 font-medium hover:underline flex items-center cursor-pointer px-3 py-2 rounded hover:bg-blue-500/20 transition-all border border-transparent hover:border-blue-500/30"
                    type="button"
                  >
                    Edit in Mermaid Live
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Analysis Panel */}
            {result.code_analysis && (
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white">AI Code Analysis</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Time Complexity</div>
                    <div className="text-lg font-mono text-orange-400">{result.code_analysis.time_complexity}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Space Complexity</div>
                    <div className="text-lg font-mono text-blue-400">{result.code_analysis.space_complexity}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Quality Score</div>
                    <div className="flex items-center">
                      <div className="text-lg font-bold text-green-400 mr-2">{result.code_analysis.quality_score}/10</div>
                      <div className="flex">
                        {[...Array(10)].map((_, i) => (
                          <svg key={i} className={`w-3 h-3 ${i < result.code_analysis.quality_score ? 'text-green-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Optimizations
                    </h4>
                    <ul className="space-y-2">
                      {result.code_analysis.optimizations?.map((opt, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Alternative Approaches
                    </h4>
                    <ul className="space-y-2">
                      {result.code_analysis.alternatives?.map((alt, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-green-500/20">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Learning Insights
                  </h4>
                  <ul className="space-y-2">
                    {result.code_analysis.learning_insights?.map((insight, i) => (
                      <li key={i} className="text-green-200 text-sm flex items-start">
                        <span className="text-green-400 mr-2">💡</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Code Output */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Generated Code</h3>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  {LANGUAGE_OPTIONS.map(lang => (
                    <option key={lang.key} value={lang.key}>
                      {lang.icon} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {LANGUAGE_OPTIONS.find(l => l.key === selectedLanguage)?.name}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(result.code_outputs[selectedLanguage])}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadCode(result.code_outputs[selectedLanguage], selectedLanguage)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg overflow-auto text-sm">
                  <code>{result.code_outputs[selectedLanguage]}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      
      {/* Chat Sidebar */}
      {showChat && (
        <div className="fixed right-0 top-0 h-full w-96 bg-slate-800 shadow-2xl flex flex-col z-10">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <h3 className="text-white font-semibold">AI Coding Tutor</h3>
                {userProfile && (
                  <div className="text-xs text-blue-100">
                    Level: <span className="font-medium capitalize">{userProfile.skill_level}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-400 mt-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">Ask me anything about your code!</p>
                <p className="text-xs mt-2">Try: "Explain this algorithm" or "How can I optimize this?"</p>
              </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : msg.type === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}>
                  {msg.skill_level && (
                    <div className="text-xs opacity-75 mb-1">
                      Adapted for: {msg.skill_level}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            
            {/* Personalized Suggestions */}
            {personalizedSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center text-green-400 text-sm font-medium mb-3">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Personalized Learning Suggestions
                </div>
                <ul className="space-y-2">
                  {personalizedSuggestions.map((suggestion, i) => (
                    <li key={i} className="text-green-200 text-sm flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {isChatting && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-slate-200 px-4 py-2 rounded-lg max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-slate-600">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about your code..."
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-blue-500 focus:outline-none"
                disabled={isChatting}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            {/* Quick Questions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Explain this algorithm",
                "How to optimize this?",
                "What's the complexity?",
                "Alternative approaches?"
              ].map((question, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setChatInput(question);
                    setTimeout(() => sendChatMessage(), 100);
                  }}
                  disabled={isChatting}
                  className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-200 rounded transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {authMode === 'login' ? 'Login to Account' : 'Create Account'}
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthMode('login');
                }}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {authMode === 'login' ? (
              <div>
                {localAccounts.length > 0 ? (
                  <div>
                    <p className="text-slate-300 mb-4">Select your account:</p>
                    <div className="space-y-2 mb-4">
                      {localAccounts.map((account) => (
                        <button
                          key={account.username}
                          onClick={() => {
                            loginToAccount(account.username);
                            setShowAuthModal(false);
                            setAuthMode('login');
                          }}
                          className="w-full flex items-center space-x-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all text-left"
                        >
                          <span className="text-2xl">{account.avatar}</span>
                          <div>
                            <div className="text-white font-medium">{account.username}</div>
                            <div className="text-xs text-slate-400">
                              Last login: {new Date(account.lastLogin).toLocaleDateString()}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 mb-4">
                    <p>No local accounts found.</p>
                  </div>
                )}
                
                <button
                  onClick={() => setAuthMode('signup')}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all"
                >
                  Create New Account
                </button>
              </div>
            ) : (
              <CreateAccountForm 
                onCreateAccount={(username, avatar) => {
                  if (createLocalAccount(username, avatar)) {
                    setShowAuthModal(false);
                    setAuthMode('login');
                  }
                }}
                onCancel={() => setAuthMode('login')}
                existingUsernames={localAccounts.map(acc => acc.username)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Create Account Form Component
function CreateAccountForm({ onCreateAccount, onCancel, existingUsernames }) {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍💻');
  const [error, setError] = useState('');

  const avatars = ['🧑‍💻', '👨‍💻', '👩‍💻', '🧙‍♂️', '🧙‍♀️', '🤖', '👨‍🔬', '👩‍🔬', '🧠', '💡', '🚀', '⭐'];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (existingUsernames.includes(username.trim())) {
      setError('Username already exists');
      return;
    }

    onCreateAccount(username.trim(), selectedAvatar);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          autoFocus
        />
      </div>

      <div className="mb-6">
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Choose Avatar
        </label>
        <div className="grid grid-cols-6 gap-2">
          {avatars.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setSelectedAvatar(avatar)}
              className={`p-3 text-2xl rounded-lg transition-all ${
                selectedAvatar === avatar
                  ? 'bg-blue-600 ring-2 ring-blue-400'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all"
        >
          Create Account
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-blue-200 text-xs">
          🔒 Your account is stored locally on your device. No data is sent to servers.
        </p>
      </div>
    </form>
  );
}

export default App;