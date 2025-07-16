class AddSpeakerToTranscriptMessages < ActiveRecord::Migration[8.0]
  def change
    add_column :transcript_messages, :speaker, :string
  end
end
