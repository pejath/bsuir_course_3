class AddDetailsToRooms < ActiveRecord::Migration[8.1]
  def change
    add_column :rooms, :capacity, :integer
    add_column :rooms, :description, :text
    add_column :rooms, :amenities, :text
    add_column :rooms, :view, :string
    add_column :rooms, :image_url, :string
  end
end
