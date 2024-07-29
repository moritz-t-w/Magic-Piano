from pipewire_python import link

inputs = link.list_inputs()
outputs = link.list_outputs()

# Helper function to find port by name and device
def find_port(devices, name, device):
    return next((d for d in devices if name.lower() in d.name.lower() and device.lower() in d.device.lower()), None)

# Connect MDA Piano to Scarlett 4i4 4th Gen Analog Stereo
mda_piano_left = find_port(outputs, "left_out", "MDA Piano")
mda_piano_right = find_port(outputs, "right_out", "MDA Piano")
scarlett_left = find_port(inputs, "playback_FL", "Scarlett 4i4 4th Gen Analog")
scarlett_right = find_port(inputs, "playback_FR", "Scarlett 4i4 4th Gen Analog")

if mda_piano_left and scarlett_left:
    mda_piano_left.connect(scarlett_left)
if mda_piano_right and scarlett_right:
    mda_piano_right.connect(scarlett_right)

# Connect Midi-Bridge to MDA Piano
midi_bridge_out = find_port(outputs, "Midi Through Port-0", "Midi-Bridge")
mda_piano_in = find_port(inputs, "input", "MDA Piano")

if midi_bridge_out and mda_piano_in:
    midi_bridge_out.connect(mda_piano_in)

# Connect Midi-Bridge to Scarlett 4i4 4th Gen MIDI
midi_bridge_out = find_port(outputs, "Midi Through Port-0", "Midi-Bridge")
scarlett_midi_in = find_port(inputs, "Scarlett 4i4 4th Gen MIDI", "Midi-Bridge")

if midi_bridge_out and scarlett_midi_in:
    midi_bridge_out.connect(scarlett_midi_in)
