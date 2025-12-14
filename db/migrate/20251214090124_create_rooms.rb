class CreateRooms < ActiveRecord::Migration[8.1]
  def change
    create_table :rooms do |t|
      t.string :number
      t.references :room_type, null: false, foreign_key: true
      t.integer :floor
      t.integer :status
      t.text :notes

      t.timestamps
    end
  end
end
