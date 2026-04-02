import React, { useEffect, useRef, useState } from 'react';

const SignalGraph = ({ data, color, label }) => {
  const points = data.map((val, i) => `${i * 6},${100 - (val * 250)}`).join(' ');
  return (
    <div style={{ background: '#252525', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #333' }}>
      <div style={{ fontSize: '10px', color: color, marginBottom: '5px', fontWeight: 'bold' }}>{label}</div>
      <svg width="300" height="100" style={{ display: 'block' }}>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  
  const [prediction, setPrediction] = useState("Connecting...");
  const [history, setHistory] = useState([]);
  
  const [vData, setVData] = useState(new Array(50).fill(0));
  const [hData, setHData] = useState(new Array(50).fill(0));

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws");

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrediction(data.prediction);
      
      setVData(prev => [...prev.slice(1), data.v_norm]);
      setHData(prev => [...prev.slice(1), data.h_norm]);

      if (data.prediction.includes("Detecting")) {
        const word = data.prediction.split(":")[1].trim();
        setHistory(prev => (prev[0] !== word ? [word, ...prev] : prev).slice(0, 6));
      }
    };

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });

    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN && videoRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, 400, 300);
        socketRef.current.send(canvas.toDataURL('image/jpeg', 0.4).split(',')[1]);
      }
    }, 130); 

    return () => {
        clearInterval(interval);
        socketRef.current.close();
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <h2 style={{ textAlign: 'center', color: '#00ffcc', letterSpacing: '3px', marginBottom: '30px' }}>SUBTLE-SPEECH ANALYTICS</h2>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Left Section: Video and Current Word */}
        <div style={{ textAlign: 'center' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '500px', borderRadius: '12px', border: '1px solid #333' }} />
          <canvas ref={canvasRef} width="400" height="300" style={{ display: 'none' }} />
          
          <div style={{ marginTop: '20px', padding: '20px', background: '#1e1e1e', borderRadius: '12px', borderLeft: '6px solid #00ffcc', textAlign: 'left' }}>
            <span style={{ fontSize: '10px', color: '#888' }}>ENGINE OUTPUT</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{prediction}</div>
          </div>
        </div>

        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
            <h4 style={{ color: '#00ffcc', marginTop: 0, fontSize: '12px' }}>REAL-TIME SIGNALS</h4>
            <SignalGraph data={vData} color="#00ffcc" label="VERTICAL (LIP APERTURE)" />
            <SignalGraph data={hData} color="#ff00ff" label="HORIZONTAL (STRETCH)" />
          </div>

          {/* Word History */}
          <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '12px', border: '1px solid #333', flexGrow: 1 }}>
            <h4 style={{ color: '#888', marginTop: 0, fontSize: '12px' }}>LOG HISTORY</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.length === 0 && <p style={{ color: '#444' }}>Waiting for speech...</p>}
              {history.map((word, i) => (
                <div key={i} style={{ padding: '10px', background: '#252525', borderRadius: '6px', opacity: 1 - i * 0.15, fontSize: '14px', borderLeft: '3px solid #444' }}>
                  {word}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;