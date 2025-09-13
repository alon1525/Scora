import { useState, useEffect } from 'react';
import './SimpleCarousel.css';

const SimpleCarousel = ({ tabs, activeTab, onTabChange, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find initial index
  useEffect(() => {
    const initialIndex = tabs.findIndex(tab => tab.value === activeTab);
    if (initialIndex !== -1) {
      setCurrentIndex(initialIndex);
    }
  }, [activeTab, tabs]);

  const handleTabClick = (index) => {
    setCurrentIndex(index);
    onTabChange(tabs[index].value);
  };

  // Fallback if tabs is empty or invalid
  if (!tabs || tabs.length === 0) {
    return <div className={`simple-carousel ${className}`}>No tabs available</div>;
  }

  return (
    <div className={`simple-carousel ${className}`}>
      <div className="simple-carousel__container">
        {tabs.map((tab, index) => (
          <button
            key={tab.value}
            className={`simple-carousel__tab ${
              index === currentIndex ? 'simple-carousel__tab--active' : ''
            }`}
            onClick={() => handleTabClick(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimpleCarousel;

