import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const data = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        label: '# of Learners',
        data: [2800, 2307], // ตัวเลขสมมติจากดีไซน์ของคุณ 
        backgroundColor: [
          'rgba(142, 21, 35, 1)', // สีแดงเข้ม MFU [cite: 198, 312]
          'rgba(189, 153, 70, 1)', // สีทอง MFU [cite: 198, 312]
        ],
        borderWidth: 1,
      },
    ],
  };
}

export default App
