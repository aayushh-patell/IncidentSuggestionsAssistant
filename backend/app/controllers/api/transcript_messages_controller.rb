class Api::TranscriptMessagesController < ApplicationController  
  def replay
    incident_id = params[:incident_id]
    TranscriptReplayJob.perform_now(incident_id)
    head :accepted
  end

  def upload
    uploaded_io = params[:file]
    incident = Incident.create!(title: "Uploaded Incident #{Time.now.to_i}")
    file_path = Rails.root.join('tmp', "transcript_#{incident.id}.json")
    File.open(file_path, 'wb') { |file| file.write(uploaded_io.read) }
    render json: { incident_id: incident.id }
  end

  def perform(incident_id)
    file_path = Rails.root.join('tmp', "transcript_#{incident_id}.json")
    transcript = JSON.parse(File.read(file_path))
    total_messages = transcript.size
    interval = 6.0 / total_messages # 1 minute / N messages
  
    incident = Incident.find(incident_id)
  
    transcript.each_with_index do |msg, idx|
      tm = TranscriptMessage.create!(
        incident: incident,
        content: msg["content"] || msg["text"] || msg
      )
      SuggestionEngine.new(tm).call
    end
  end

  def paste
    transcript = params[:transcript]
    title = params[:title].presence || "Pasted Incident #{Time.now.to_i}"
    if transcript.nil?
      render json: { error: "No transcript provided" }, status: :bad_request and return
    end
    incident = Incident.create!(title: title)
    file_path = Rails.root.join('tmp', "transcript_#{incident.id}.json")
    File.open(file_path, 'w') { |file| file.write(transcript.to_json) }
    render json: { incident_id: incident.id }
  end
end
