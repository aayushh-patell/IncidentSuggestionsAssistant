class TranscriptReplayJob < ApplicationJob
  queue_as :default

  def perform(incident_id)
    incident = Incident.find(incident_id)
    # Load the transcript from the file
    file_path = Rails.root.join('tmp', "transcript_#{incident.id}.json")
    transcript_json = File.read(file_path)
    transcript = JSON.parse(transcript_json)
    messages = transcript["meeting_transcript"]

    # Simulate real-time ingestion at 10x speed
    total_duration = 60.0
    interval = total_duration / messages.size

    messages.each_with_index do |msg, idx|
      sleep(interval) if idx > 0
      tm = TranscriptMessage.create!(
        incident: incident,
        content: msg['text'],
        speaker: msg['speaker']
      )
      SuggestionEngine.new(tm).call
    end
  end
end
