import React from 'react';

const PredictionBar = ({ predictions, homeTeam, awayTeam }) => {
  // Team colors mapping
  const TEAM_COLORS = {
    'Arsenal': '#EF0107',
    'Aston Villa': '#670E36',
    'Bournemouth': '#DA291C',
    'Brentford': '#E30613',
    'Brighton': '#0057B8',
    'Burnley': '#6C1D45',
    'Chelsea': '#034694',
    'Crystal Palace': '#1B458F',
    'Everton': '#003399',
    'Leeds': '#FFFFFF',
    'Leeds United': '#FFFFFF',
    'Leicester': '#003090',
    'Leicester City': '#003090',
    'Liverpool': '#C8102E',
    'Manchester City': '#6CABDD',
    'Manchester United': '#DA291C',
    'Newcastle': '#241F20',
    'Newcastle United': '#241F20',
    'Nottingham Forest': '#DD0000',
    'Sunderland': '#E30613',
    'Tottenham': '#FFFFFF',
    'Tottenham Hotspur': '#FFFFFF',
    'West Ham': '#7A263A',
    'West Ham United': '#7A263A',
    'Wolves': '#FDB913'
  };

  const getCleanTeamName = (teamName) => {
    // Remove common suffixes and clean up team names
    return teamName
      .replace(/\s+(FC|United|City|Town|Albion|Hotspur|Wanderers|Rovers)$/i, '')
      .trim();
  };

  const cleanHomeTeam = getCleanTeamName(homeTeam);
  const cleanAwayTeam = getCleanTeamName(awayTeam);
  
  const homeColor = TEAM_COLORS[cleanHomeTeam] || TEAM_COLORS[homeTeam] || '#3B82F6';
  const awayColor = TEAM_COLORS[cleanAwayTeam] || TEAM_COLORS[awayTeam] || '#EF4444';
  const drawColor = '#6B7280';

  if (!predictions || predictions.length === 0) {
    return (
      <div className="prediction-bar-container" style={{
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        padding: '12px 16px',
        marginTop: '12px'
      }}>
        <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', margin: 0 }}>
          No predictions yet
        </p>
      </div>
    );
  }

  // Calculate percentages
  const totalPredictions = predictions.length;
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  predictions.forEach(prediction => {
    const { home_score, away_score } = prediction;
    
    if (home_score > away_score) {
      homeWins++;
    } else if (away_score > home_score) {
      awayWins++;
    } else {
      draws++;
    }
  });

  const homePercentage = Math.round((homeWins / totalPredictions) * 100);
  const awayPercentage = Math.round((awayWins / totalPredictions) * 100);
  const drawPercentage = Math.round((draws / totalPredictions) * 100);

  return (
    <div className="prediction-bar-container" style={{
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
      borderTop: '1px solid rgba(0, 0, 0, 0.05)',
      padding: '12px 16px',
      marginTop: '12px'
    }}>
      <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '500' }}>
        Community Predictions ({totalPredictions} votes)
      </p>
      
      <div className="prediction-bars" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Home Team Bar */}
        <div 
          className="prediction-bar home-bar"
          style={{
            backgroundColor: homeColor,
            height: '24px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: homePercentage > 0 ? '30px' : '0px',
            flex: homePercentage,
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          title={`${homeTeam} win: ${homePercentage}%`}
        >
          {homePercentage > 0 && (
            <span 
              style={{ 
                color: homeColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
                textShadow: homeColor === '#FFFFFF' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                zIndex: 1
              }}
            >
              {homePercentage}%
            </span>
          )}
        </div>

        {/* Draw Bar */}
        <div 
          className="prediction-bar draw-bar"
          style={{
            backgroundColor: drawColor,
            height: '24px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: drawPercentage > 0 ? '30px' : '0px',
            flex: drawPercentage,
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          title={`Draw: ${drawPercentage}%`}
        >
          {drawPercentage > 0 && (
            <span 
              style={{ 
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                zIndex: 1
              }}
            >
              {drawPercentage}%
            </span>
          )}
        </div>

        {/* Away Team Bar */}
        <div 
          className="prediction-bar away-bar"
          style={{
            backgroundColor: awayColor,
            height: '24px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: awayPercentage > 0 ? '30px' : '0px',
            flex: awayPercentage,
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          title={`${awayTeam} win: ${awayPercentage}%`}
        >
          {awayPercentage > 0 && (
            <span 
              style={{ 
                color: awayColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                fontSize: '12px',
                fontWeight: '600',
                textShadow: awayColor === '#FFFFFF' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                zIndex: 1
              }}
            >
              {awayPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="prediction-legend" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '8px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: homeColor, 
            borderRadius: '2px' 
          }}></div>
          <span>{cleanHomeTeam}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: drawColor, 
            borderRadius: '2px' 
          }}></div>
          <span>Draw</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: awayColor, 
            borderRadius: '2px' 
          }}></div>
          <span>{cleanAwayTeam}</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionBar;