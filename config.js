/**
 * config.js — NASCAR Stage Points Tracker
 * ----------------------------------------
 * Edit this file each race week to update:
 *   1. The live JSON URLs for the current race
 *   2. Each player's selected driver
 */

const CONFIG = {

  // ─── Race Info ────────────────────────────────────────────────────────────
  raceName: 'NASCAR Cup Series Race',
  raceTrack: '',  // e.g. "Daytona International Speedway"

  // ─── Data Source URLs ────────────────────────────────────────────────────
  // Find RACE_ID by opening DevTools on nascar.com during a race and
  // filtering Network requests for "live-feed.json"
  
  liveFeedUrl:   'https://cf.nascar.com/live/feeds/live-feed.json',
  livePointsUrl: 'https://cf.nascar.com/live/feeds/live-points.json  ',

  // ─── Refresh Interval (milliseconds) ─────────────────────────────────────
  refreshInterval: 30000,   // 30s; set to 0 to disable

  // ─── Stage Points Structure ───────────────────────────────────────────────
  stagePointPositions: 10,  // Top 10 earn points in each stage

  // ─── Player → Driver Mappings ─────────────────────────────────────────────
  players: [
    { playerName: 'The DAD', driverName: 'Chris Buescher',      driverId: 3989, color: '#e63946' },
    { playerName: 'Todd',    driverName: 'Chase Elliott', driverId: 4062, color: '#2a9d8f' },
    { playerName: 'Blake',   driverName: 'Bubba Wallace',    driverId: 4025, color: '#e9c46a' },
    { playerName: 'LLR',     driverName: 'Ty Gibbs',     driverId: 4368, color: '#f4a261' },
    { playerName: 'LMR',     driverName: 'Brad Keselowski',    driverId: 1816, color: '#a8dadc' },
  ],

  // ─── JSON Field Map ───────────────────────────────────────────────────────
  feedFields: {
    vehicles:         'vehicles',
    driverFullName:   'driver.full_name',
    driverId:         'driver.driver_id',
    vehicleNumber:    'vehicle_number',
    runningPosition:  'running_position',
    lapsCompleted:    'laps_completed',
    lapsInRace:       'laps_in_race',
    lapNumber:        'lap_number',
    flagState:        'flag_state',
    stage:            'stage',
    stageNum:         'stage.stage_num',
    stageFinishLap:   'stage.finish_at_lap'
  },

  pointsFields: {
    pointsData:   'pointsData',
    driverName:   'full_name',
    driverId:     'driver_id',
    stage1Points: 'stage1_points',
    stage2Points: 'stage2_points',
    racePoints:   'race_points',
    totalPoints:  'total_points'
  }

};
