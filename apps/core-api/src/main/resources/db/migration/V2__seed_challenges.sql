-- Seed Initial Challenges and Skills

INSERT INTO skills (id, name, category, description)
VALUES 
    ('sk-java-001', 'Java Fundamentals', 'PROGRAMMING', 'Core Java syntax, collections, and streams'),
    ('sk-algo-001', 'Data Structures & Algorithms', 'COMPUTER_SCIENCE', 'Arrays, Trees, Graphs, and Dynamic Programming'),
    ('sk-sys-001', 'System Design & Concurrency', 'ARCHITECTURE', 'Thread safety, async execution, and modular patterns')
ON CONFLICT (id) DO NOTHING;

INSERT INTO challenges (id, title, slug, description, difficulty, status, points, time_limit_ms, memory_limit_mb, starter_code)
VALUES 
    (
        'ch-001',
        'Two Sum Problem',
        'two-sum-problem',
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Each input will have exactly one solution.',
        'EASY',
        'PUBLISHED',
        10,
        1000,
        128,
        'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}'
    ),
    (
        'ch-002',
        'LRU Cache Implementation',
        'lru-cache-implementation',
        'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) time complexity for get and put operations.',
        'MEDIUM',
        'PUBLISHED',
        25,
        2000,
        256,
        'class LRUCache {\n    public LRUCache(int capacity) {\n    }\n    public int get(int key) {\n        return -1;\n    }\n    public void put(int key, int value) {\n    }\n}'
    ),
    (
        'ch-003',
        'Distributed Rate Limiter',
        'distributed-rate-limiter',
        'Implement a token bucket rate limiter capable of sliding window rate limiting across concurrent clients without lock starvation.',
        'HARD',
        'PUBLISHED',
        50,
        3000,
        512,
        'public interface RateLimiter {\n    boolean allowRequest(String clientId);\n}'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO challenge_skills (challenge_id, skill_id)
VALUES 
    ('ch-001', 'sk-algo-001'),
    ('ch-002', 'sk-algo-001'),
    ('ch-002', 'sk-java-001'),
    ('ch-003', 'sk-sys-001')
ON CONFLICT DO NOTHING;

