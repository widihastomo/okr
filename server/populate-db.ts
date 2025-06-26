import { storage } from './storage';

async function populateDatabase() {
  try {
    console.log('Mulai populate database...');
    
    // Create sample users
    const user1 = await storage.upsertUser({
      id: 'user1',
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      profileImageUrl: null
    });
    
    const user2 = await storage.upsertUser({
      id: 'user2', 
      email: 'jane.smith@company.com',
      firstName: 'Jane',
      lastName: 'Smith',
      profileImageUrl: null
    });
    
    const user3 = await storage.upsertUser({
      id: 'user3',
      email: 'mike.wilson@company.com', 
      firstName: 'Mike',
      lastName: 'Wilson',
      profileImageUrl: null
    });
    
    console.log('Users created:', user1.id, user2.id, user3.id);
    
    // Create sample teams
    const team1 = await storage.createTeam({
      name: 'Engineering Team',
      description: 'Product development and engineering team',
      ownerId: 'user1'
    });
    
    const team2 = await storage.createTeam({
      name: 'Marketing Team',
      description: 'Marketing and growth team', 
      ownerId: 'user2'
    });
    
    console.log('Teams created:', team1.id, team2.id);
    
    // Create sample cycles
    const cycle1 = await storage.createCycle({
      name: 'January 2025',
      type: 'monthly',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      status: 'active',
      description: 'January monthly objectives for 2025'
    });
    
    console.log('Cycle created:', cycle1.id);
    
    // Create sample objective
    const obj1 = await storage.createObjective({
      cycleId: cycle1.id,
      title: 'Increase Product Adoption',
      description: 'Drive user engagement and product adoption across all segments',
      timeframe: 'January 2025',
      owner: 'John Doe',
      ownerType: 'user',
      ownerId: 'user1',
      status: 'in_progress'
    });
    
    console.log('Objective created:', obj1.id);
    
    // Create sample key results
    const kr1 = await storage.createKeyResult({
      objectiveId: obj1.id,
      title: 'Increase Monthly Active Users',
      description: 'Grow the number of monthly active users',
      currentValue: '850',
      targetValue: '1000',
      baseValue: '800',
      unit: 'users',
      keyResultType: 'increase_to',
      status: 'in_progress'
    });
    
    const kr2 = await storage.createKeyResult({
      objectiveId: obj1.id,
      title: 'Improve User Retention Rate',
      description: 'Increase the percentage of users who return after first visit',
      currentValue: '72',
      targetValue: '80',
      baseValue: '70',
      unit: 'percentage',
      keyResultType: 'increase_to',
      status: 'on_track'
    });
    
    console.log('Key results created:', kr1.id, kr2.id);
    console.log('Database populated successfully!');
    
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

populateDatabase();