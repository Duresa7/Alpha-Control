CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('article', 'update')),
  title TEXT NOT NULL,
  message TEXT,
  href TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notifications"
  ON notifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Bossman can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bossman')
  );

CREATE POLICY "Bossman can update notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bossman')
  );

CREATE POLICY "Bossman can delete notifications"
  ON notifications FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'bossman')
  );
