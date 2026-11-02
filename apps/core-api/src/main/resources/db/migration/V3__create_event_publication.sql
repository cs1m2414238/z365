-- Spring Modulith 2.1+ Event Publication Registry Schema

CREATE TABLE IF NOT EXISTS event_publication (
    id UUID NOT NULL,
    listener_id VARCHAR(512) NOT NULL,
    event_type VARCHAR(512) NOT NULL,
    serialized_event TEXT NOT NULL,
    publication_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE,
    last_resubmission_date TIMESTAMP WITH TIME ZONE,
    completion_attempts INT NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'INCOMPLETE',
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_event_publication_date ON event_publication(publication_date);
CREATE INDEX IF NOT EXISTS idx_event_publication_completion ON event_publication(completion_date);
