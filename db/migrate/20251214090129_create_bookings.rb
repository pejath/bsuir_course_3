class CreateBookings < ActiveRecord::Migration[8.1]
  def change
    create_table :bookings do |t|
      t.references :room, null: false, foreign_key: true
      t.references :guest, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.date :check_in_date
      t.date :check_out_date
      t.integer :number_of_guests
      t.decimal :total_price
      t.integer :status
      t.text :notes

      t.timestamps
    end
  end
end
