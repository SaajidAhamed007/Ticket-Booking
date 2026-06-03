-- EventX Platform - Sample Data for Development & Testing
-- Insert sample users, events, seat tiers, and seats

-- ============================================
-- SAMPLE USERS
-- ============================================

-- Sample Organizer (password: organizer123)
INSERT INTO users (email, password_hash, name, role) VALUES
('organizer@example.com', '$2b$10$YourHashedPassword1', 'John Organizer', 'organizer')
ON CONFLICT DO NOTHING;

-- Sample Attendees (password: attendee123)
INSERT INTO users (email, password_hash, name, role) VALUES
('attendee1@example.com', '$2b$10$YourHashedPassword2', 'Alice Attendee', 'attendee'),
('attendee2@example.com', '$2b$10$YourHashedPassword3', 'Bob Attendee', 'attendee'),
('attendee3@example.com', '$2b$10$YourHashedPassword4', 'Charlie Attendee', 'attendee')
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE EVENTS
-- ============================================

INSERT INTO events (organizer_id, title, description, category, venue, date_time, status, capacity, banner_url) VALUES
(
    (SELECT id FROM users WHERE email = 'organizer@example.com' LIMIT 1),
    'Summer Music Festival 2024',
    'A grand summer music festival featuring international artists',
    'Music',
    'Central Park Amphitheater',
    '2024-07-15 18:00:00',
    'published',
    500,
    'https://example.com/festival-banner.jpg'
),
(
    (SELECT id FROM users WHERE email = 'organizer@example.com' LIMIT 1),
    'Tech Conference 2024',
    'Annual tech conference with keynotes and workshops',
    'Technology',
    'Convention Center Hall A',
    '2024-08-20 09:00:00',
    'published',
    1000,
    'https://example.com/tech-conf-banner.jpg'
);

-- ============================================
-- SAMPLE SEAT TIERS
-- ============================================

-- Tiers for Summer Music Festival
INSERT INTO seat_tiers (event_id, tier_name, tier_type, price, capacity) VALUES
(
    (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1),
    'General Admission',
    'GENERAL_ADMISSION',
    50.00,
    300
),
(
    (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1),
    'VIP Seating',
    'VIP',
    100.00,
    150
),
(
    (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1),
    'Premium Front Row',
    'PREMIUM',
    150.00,
    50
);

-- Tiers for Tech Conference
INSERT INTO seat_tiers (event_id, tier_name, tier_type, price, capacity) VALUES
(
    (SELECT id FROM events WHERE title = 'Tech Conference 2024' LIMIT 1),
    'Standard Pass',
    'GENERAL_ADMISSION',
    75.00,
    600
),
(
    (SELECT id FROM events WHERE title = 'Tech Conference 2024' LIMIT 1),
    'Premium Pass',
    'VIP',
    150.00,
    300
),
(
    (SELECT id FROM events WHERE title = 'Tech Conference 2024' LIMIT 1),
    'Executive Pass',
    'PREMIUM',
    250.00,
    100
);

-- ============================================
-- SAMPLE SEATS
-- ============================================

-- Generate seats for Summer Music Festival General Admission (100 seats)
INSERT INTO seats (event_id, tier_id, seat_number, status) VALUES
(
    (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1),
    (SELECT id FROM seat_tiers WHERE tier_name = 'General Admission' AND event_id = (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1) LIMIT 1),
    CONCAT('GA-', ROW_NUMBER() OVER (ORDER BY (SELECT 1))),
    'available'
)
-- Note: In real implementation, use a loop or stored procedure to generate multiple seats

;

-- For simplicity, you can run this query multiple times or use a stored procedure
-- Sample manual seat insertion:
INSERT INTO seats (event_id, tier_id, seat_number, status) 
SELECT
    (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1) as event_id,
    (SELECT id FROM seat_tiers WHERE tier_name = 'General Admission' LIMIT 1) as tier_id,
    CONCAT('GA-', seq) as seat_number,
    'available' as status
FROM generate_series(1, 20) seq
ON CONFLICT DO NOTHING;

INSERT INTO seats (event_id, tier_id, seat_number, status) 
SELECT
    (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1) as event_id,
    (SELECT id FROM seat_tiers WHERE tier_name = 'VIP Seating' LIMIT 1) as tier_id,
    CONCAT('VIP-', seq) as seat_number,
    'available' as status
FROM generate_series(1, 10) seq
ON CONFLICT DO NOTHING;

INSERT INTO seats (event_id, tier_id, seat_number, status) 
SELECT
    (SELECT id FROM events WHERE title = 'Summer Music Festival 2024' LIMIT 1) as event_id,
    (SELECT id FROM seat_tiers WHERE tier_name = 'Premium Front Row' LIMIT 1) as tier_id,
    CONCAT('PREMIUM-', seq) as seat_number,
    'available' as status
FROM generate_series(1, 5) seq
ON CONFLICT DO NOTHING;

-- Seats for Tech Conference
INSERT INTO seats (event_id, tier_id, seat_number, status) 
SELECT
    (SELECT id FROM events WHERE title = 'Tech Conference 2024' LIMIT 1) as event_id,
    (SELECT id FROM seat_tiers WHERE tier_name = 'Standard Pass' LIMIT 1) as tier_id,
    CONCAT('STD-', seq) as seat_number,
    'available' as status
FROM generate_series(1, 30) seq
ON CONFLICT DO NOTHING;

INSERT INTO seats (event_id, tier_id, seat_number, status) 
SELECT
    (SELECT id FROM events WHERE title = 'Tech Conference 2024' LIMIT 1) as event_id,
    (SELECT id FROM seat_tiers WHERE tier_name = 'Premium Pass' LIMIT 1) as tier_id,
    CONCAT('PREM-', seq) as seat_number,
    'available' as status
FROM generate_series(1, 15) seq
ON CONFLICT DO NOTHING;

INSERT INTO seats (event_id, tier_id, seat_number, status) 
SELECT
    (SELECT id FROM events WHERE title = 'Tech Conference 2024' LIMIT 1) as event_id,
    (SELECT id FROM seat_tiers WHERE tier_name = 'Executive Pass' LIMIT 1) as tier_id,
    CONCAT('EXEC-', seq) as seat_number,
    'available' as status
FROM generate_series(1, 5) seq
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count records by table:
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'seat_tiers', COUNT(*) FROM seat_tiers
UNION ALL
SELECT 'seats', COUNT(*) FROM seats
ORDER BY table_name;
