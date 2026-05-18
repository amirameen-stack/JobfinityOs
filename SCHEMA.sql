-- Create leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  job_department VARCHAR(255),
  job_level VARCHAR(255),
  company_size VARCHAR(255),
  revenue_range VARCHAR(255),
  city VARCHAR(255),
  country VARCHAR(255),
  status VARCHAR(50) DEFAULT 'newLeads' CHECK (status IN ('newLeads', 'potential', 'contacted')),
  folder_id UUID REFERENCES lead_folders(id) ON DELETE SET NULL,
  auto_call_excluded BOOLEAN DEFAULT false,
  call_attempts INTEGER DEFAULT 0,
  last_called_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create lead_folders table
CREATE TABLE lead_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create calls table
CREATE TABLE calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  twilio_sid VARCHAR(255) NOT NULL UNIQUE,
  to_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer')),
  duration INTEGER,
  transcript JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create lead_files table
CREATE TABLE lead_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_folder_id ON leads(folder_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_auto_call_excluded ON leads(auto_call_excluded);
CREATE INDEX idx_leads_last_called_at ON leads(last_called_at);

CREATE INDEX idx_lead_folders_user_id ON lead_folders(user_id);

CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_twilio_sid ON calls(twilio_sid);

CREATE INDEX idx_lead_files_user_id ON lead_files(user_id);
CREATE INDEX idx_lead_files_lead_id ON lead_files(lead_id);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Users can only see their own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for lead_folders
CREATE POLICY "Users can only see their own folders" ON lead_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own folders" ON lead_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own folders" ON lead_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own folders" ON lead_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for calls
CREATE POLICY "Users can only see their own calls" ON calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own calls" ON calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own calls" ON calls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own calls" ON calls
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for lead_files
CREATE POLICY "Users can only see their own files" ON lead_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own files" ON lead_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own files" ON lead_files
  FOR DELETE USING (auth.uid() = user_id);
