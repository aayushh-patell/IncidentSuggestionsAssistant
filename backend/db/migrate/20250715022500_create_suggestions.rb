class CreateSuggestions < ActiveRecord::Migration[8.0]
  def change
    create_table :suggestions do |t|
      t.text :content
      t.string :description
      t.integer :suggestion_type
      t.references :transcript_message, null: false, foreign_key: true
      t.references :incident, null: false, foreign_key: true

      t.timestamps
    end
  end
end
