# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_07_15_235117) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "incidents", force: :cascade do |t|
    t.string "title"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "suggestions", force: :cascade do |t|
    t.text "content"
    t.string "description"
    t.integer "suggestion_type"
    t.bigint "transcript_message_id", null: false
    t.bigint "incident_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "title"
    t.index ["incident_id"], name: "index_suggestions_on_incident_id"
    t.index ["transcript_message_id"], name: "index_suggestions_on_transcript_message_id"
  end

  create_table "transcript_messages", force: :cascade do |t|
    t.text "content"
    t.bigint "incident_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "speaker"
    t.index ["incident_id"], name: "index_transcript_messages_on_incident_id"
  end

  add_foreign_key "suggestions", "incidents"
  add_foreign_key "suggestions", "transcript_messages"
  add_foreign_key "transcript_messages", "incidents"
end
