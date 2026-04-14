import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Test Card */}
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center">
        
        {/* Test: Custom Accent Color & Font Weight */}
        <h1 className="text-4xl font-black text-accent mb-4 tracking-tight">
          Sew Le Sew
        </h1>
        
        {/* Test: Standard Utilities & Text Opacity */}
        <p className="text-slate-400 mb-8">
          If you see this card centered with a purple title, 
          <span className="text-green-400 font-bold"> Tailwind is 100% Active.</span>
        </p>

        {/* Test: Custom Component Layer (@apply test) */}
        <button className="btn-primary">
          Verify Deployment
        </button>

        {/* Test: Responsive Grid/Flex */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="h-2 w-8 bg-accent rounded-full animate-pulse"></div>
          <div className="h-2 w-2 bg-slate-700 rounded-full"></div>
          <div className="h-2 w-2 bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default App;