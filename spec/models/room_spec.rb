require 'rails_helper'

RSpec.describe Room, type: :model do
  subject { build(:room) }
  
  describe 'Associations' do
    it { should belong_to(:room_type) }
    it { should have_many(:bookings).dependent(:restrict_with_error) }
  end

  describe 'Validations' do
    it { should validate_presence_of(:number) }
    it { should validate_presence_of(:floor) }
    it { should validate_numericality_of(:floor).only_integer }
    it { should validate_presence_of(:status) }
    it { should validate_numericality_of(:capacity).only_integer.is_greater_than(0) }
  end

  describe 'Enums' do
    it { should define_enum_for(:status).with_values(available: 0, occupied: 1, maintenance: 2, reserved: 3) }
  end

  describe 'Scopes' do
    let!(:available_room) { create(:room, status: :available) }
    let!(:occupied_room) { create(:room, status: :occupied) }
    let!(:maintenance_room) { create(:room, status: :maintenance) }

    describe '.available' do
      it 'returns only available rooms' do
        expect(Room.available).to include(available_room)
        expect(Room.available).not_to include(occupied_room, maintenance_room)
      end
    end

    describe '.occupied' do
      it 'returns only occupied rooms' do
        expect(Room.occupied).to include(occupied_room)
        expect(Room.occupied).not_to include(available_room, maintenance_room)
      end
    end

    describe '.on_floor' do
      it 'returns rooms on specified floor' do
        room_floor_1 = create(:room, floor: 1)
        room_floor_2 = create(:room, floor: 2)
        
        expect(Room.on_floor(1)).to include(room_floor_1)
        expect(Room.on_floor(1)).not_to include(room_floor_2)
      end
    end
  end

  describe 'Instance Methods' do
    let(:room) { create(:room) }

    describe '#available?' do
      it 'returns true for available rooms' do
        room.update!(status: :available)
        expect(room.available?).to be true
      end

      it 'returns false for non-available rooms' do
        room.update!(status: :occupied)
        expect(room.available?).to be false
      end
    end

    describe '#occupied?' do
      it 'returns true for occupied rooms' do
        room.update!(status: :occupied)
        expect(room.occupied?).to be true
      end

      it 'returns false for non-occupied rooms' do
        room.update!(status: :available)
        expect(room.occupied?).to be false
      end
    end
  end
end
