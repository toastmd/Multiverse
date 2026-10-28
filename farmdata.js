'use strict';
// Crops grown at Sunny Acres Farm: [id, name, planting level needed, growing time in seconds, value of one crop]
module.exports = {
  CROPS: [['carrot', 'carrot', 1, 45, 12], ['potato', 'potato', 4, 60, 16], ['lettuce', 'head of lettuce', 8, 75, 22], ['corn', 'ear of corn', 12, 90, 30], ['tomato', 'tomato', 16, 105, 40], ['pumpkin', 'pumpkin', 22, 120, 70], ['strawberry', 'basket of strawberries', 30, 150, 100], ['watermelon', 'watermelon', 40, 180, 140]],
  FARM_SKILLS: ['tilling', 'planting', 'milking', 'shearing'],
  REWARD_LEVEL: 20, // all four skills at this level earn the denim overalls and the golden hoe
  BAN_MS: 60 * 60 * 1000, // killing the farmer, a cow or a sheep: no farming for an hour
};
