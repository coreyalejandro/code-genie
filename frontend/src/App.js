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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const flowchartRef = useRef(null);

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

  const processInput = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      let response;
      
      if (inputType === 'image' && uploadedFile) {
        // Handle image upload
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('session_id', sessionId);
        formData.append('description', imageDescription);
        
        response = await axios.post(`${API}/process-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Handle text, code, or audio input
        let content;
        if (inputType === 'text') {
          content = textInput;
        } else if (inputType === 'code') {
          content = codeInput;
        } else if (inputType === 'audio' && uploadedFile) {
          // For audio, we'll send a placeholder since real speech-to-text would need additional setup
          content = "Audio file uploaded - please implement speech-to-text conversion";
        }
        
        response = await axios.post(`${API}/process`, {
          session_id: sessionId,
          input_type: inputType,
          content: content,
          description: inputType === 'image' ? imageDescription : null
        });
      }
      
      setResult(response.data);
      setActiveTab('results');
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.response?.data?.detail || 'An error occurred while processing your input');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            AI <span className="text-blue-400">Multimodal</span> Coding Assistant
          </h1>
          <p className="text-slate-300 text-xl max-w-3xl mx-auto">
            Transform any input into pseudocode, flowcharts, and code in 10 programming languages
          </p>
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
          </div>
        </div>

        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="max-w-4xl mx-auto">
            {/* Input Type Selection */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Choose Input Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { type: 'text', icon: FileText, label: 'Text Description' },
                  { type: 'code', icon: Code, label: 'Code Snippet' },
                  { type: 'image', icon: Image, label: 'Image/Diagram' },
                  { type: 'audio', icon: Mic, label: 'Voice/Audio' }
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setInputType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      inputType === type
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
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
                  <label className="block text-white font-medium mb-3">
                    Describe your algorithm or logic:
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="E.g., Create a function that sorts an array using bubble sort algorithm..."
                    className="w-full h-32 bg-slate-700 text-white rounded-lg p-4 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              {inputType === 'code' && (
                <div>
                  <label className="block text-white font-medium mb-3">
                    Paste your code:
                  </label>
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste your code here..."
                    className="w-full h-32 bg-slate-700 text-white rounded-lg p-4 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                  />
                </div>
              )}

              {inputType === 'image' && (
                <div>
                  <label className="block text-white font-medium mb-3">
                    Upload an image or diagram:
                  </label>
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
                        placeholder="E.g., flowchart showing a sorting algorithm, handwritten pseudocode..."
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
                onClick={processInput}
                disabled={isProcessing || (!textInput && !codeInput && !uploadedFile)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 inline mr-2" />
                    Transform with AI
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
                <h3 className="text-xl font-semibold text-white mb-4">Flowchart</h3>
                <div 
                  ref={flowchartRef}
                  className="bg-slate-900 p-4 rounded-lg overflow-auto min-h-[300px] flex items-center justify-center"
                />
              </div>
            </div>

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
  );
}

export default App;