class CreateRoomTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :room_types do |t|
      t.string :name
      t.text :description
      t.integer :capacity
      t.decimal :base_price
      t.jsonb :amenities

      t.timestamps
    end
  end
end
