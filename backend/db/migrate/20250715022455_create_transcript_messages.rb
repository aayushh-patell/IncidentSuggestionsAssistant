class CreateTranscriptMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :transcript_messages do |t|
      t.text :content
      t.references :incident, null: false, foreign_key: true

      t.timestamps
    end
  end
end
