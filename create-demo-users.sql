-- Create demo users for each role
INSERT INTO users (username, password, role, first_name, last_name, email, phone, is_active, require_password_change)
VALUES 
  ('admin_demo', '$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u', 'admin', 'Admin', 'Demo', 'admin@demo.com', '+1234567890', true, false),
  ('club_manager_demo', '$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u', 'club_manager', 'Club', 'Manager', 'manager@demo.com', '+1234567891', true, false),
  ('security_lead_demo', '$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u', 'security_teamleader', 'Security', 'Leader', 'lead@demo.com', '+1234567892', true, false),
  ('security_staff_demo', '$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u', 'security_personnel', 'Security', 'Staff', 'staff@demo.com', '+1234567893', true, false),
  ('employee_demo', '$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u', 'club_employee', 'Club', 'Employee', 'employee@demo.com', '+1234567894', true, false);

-- Create a demo club
INSERT INTO clubs (name, address, phone, email, capacity, description)
VALUES ('Demo Club', '123 Demo Street, Demo City', '+1234567890', 'info@democlub.com', 500, 'Demo club for testing purposes');

-- Get the club ID and assign users to it
INSERT INTO user_club_assignments (user_id, club_id, created_at)
SELECT u.id, c.id, NOW()
FROM users u, clubs c
WHERE u.username IN ('club_manager_demo', 'security_lead_demo', 'security_staff_demo', 'employee_demo')
AND c.name = 'Demo Club';