class AddTitleToSuggestions < ActiveRecord::Migration[8.0]
  def change
    add_column :suggestions, :title, :string
  end
end
