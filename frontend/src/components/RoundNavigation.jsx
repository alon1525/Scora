import { useState, useEffect } from 'react';

const RoundNavigation = ({ currentMatchday, maxMatchday, onMatchdayChange }) => {
  const [visibleRounds, setVisibleRounds] = useState([]);
  const [startIndex, setStartIndex] = useState(0);

  // Generate rounds data
  const generateRounds = () => {
    const rounds = [];
    for (let i = 1; i <= Math.max(maxMatchday, 38); i++) {
      const startDate = new Date(2024, 7, 17 + (i - 1) * 7); // August 17, 2024 + 7 days per round
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 3); // 3-day window for each round
      
      rounds.push({
        number: i,
        startDate,
        endDate,
        isActive: i === currentMatchday,
        isAvailable: i <= maxMatchday
      });
    }
    return rounds;
  };

  const allRounds = generateRounds();

  useEffect(() => {
    updateVisibleRounds();
  }, [currentMatchday, maxMatchday]);

  const updateVisibleRounds = () => {
    const currentIndex = allRounds.findIndex(round => round.number === currentMatchday);
    const maxVisible = 7; // Show 7 rounds at a time
    let newStartIndex = Math.max(0, currentIndex - Math.floor(maxVisible / 2));
    newStartIndex = Math.min(newStartIndex, Math.max(0, allRounds.length - maxVisible));
    
    setStartIndex(newStartIndex);
    setVisibleRounds(allRounds.slice(newStartIndex, newStartIndex + maxVisible));
  };

  const handlePrevious = () => {
    const newStartIndex = Math.max(0, startIndex - 3);
    setStartIndex(newStartIndex);
    setVisibleRounds(allRounds.slice(newStartIndex, newStartIndex + 7));
  };

  const handleNext = () => {
    const maxStart = Math.max(0, allRounds.length - 7);
    const newStartIndex = Math.min(maxStart, startIndex + 3);
    setStartIndex(newStartIndex);
    setVisibleRounds(allRounds.slice(newStartIndex, newStartIndex + 7));
  };

  const formatRoundDates = (round) => {
    const start = round.startDate;
    const end = round.endDate;
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`;
    } else {
      return `${start.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('en-US', { month: 'short' })}`;
    }
  };

  return (
    <div className="round-navigation">
      <button 
        className="round-nav-btn" 
        onClick={handlePrevious}
        disabled={startIndex === 0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
      </button>

      <div className="rounds-container">
        {visibleRounds.map((round) => (
          <button
            key={round.number}
            className={`round-item ${round.isActive ? 'active' : ''} ${!round.isAvailable ? 'disabled' : ''}`}
            onClick={() => round.isAvailable && onMatchdayChange(round.number)}
            disabled={!round.isAvailable}
          >
            <div className="round-number">Matchweek {round.number}</div>
            <div className="round-dates">{formatRoundDates(round)}</div>
          </button>
        ))}
      </div>

      <button 
        className="round-nav-btn" 
        onClick={handleNext}
        disabled={startIndex >= Math.max(0, allRounds.length - 7)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default RoundNavigation;
