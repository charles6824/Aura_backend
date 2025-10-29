import Database from '../config/database';
import logger from '../config/logger';

class CacheService {
  private redis = Database.getRedisClient();

  async get(key: string): Promise<any> {
    try {
      if (!this.redis) return null;
      
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      await this.redis.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Specific cache methods for common use cases
  async cacheJobMatches(userId: string, matches: any[], ttl: number = 1800): Promise<void> {
    await this.set(`job_matches:${userId}`, matches, ttl);
  }

  async getCachedJobMatches(userId: string): Promise<any[] | null> {
    return this.get(`job_matches:${userId}`);
  }

  async cacheUserProfile(userId: string, profile: any, ttl: number = 3600): Promise<void> {
    await this.set(`user_profile:${userId}`, profile, ttl);
  }

  async getCachedUserProfile(userId: string): Promise<any | null> {
    return this.get(`user_profile:${userId}`);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.delPattern(`*:${userId}`);
  }

  async cacheAssessmentQuestions(type: string, questions: any[], ttl: number = 7200): Promise<void> {
    await this.set(`assessment_questions:${type}`, questions, ttl);
  }

  async getCachedAssessmentQuestions(type: string): Promise<any[] | null> {
    return this.get(`assessment_questions:${type}`);
  }

  async cacheJobStats(stats: any, ttl: number = 1800): Promise<void> {
    await this.set('job_stats', stats, ttl);
  }

  async getCachedJobStats(): Promise<any | null> {
    return this.get('job_stats');
  }
}

export default new CacheService();