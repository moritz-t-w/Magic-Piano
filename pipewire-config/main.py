from pipewire_python import link
import time

inputs = link.list_inputs()
outputs = link.list_outputs()

print('OUTPUTS:', outputs)
print('INPUTS:', inputs)

def match_port(port, name, device):
    if not hasattr(port, 'name'):
        for sub_port in [port.left, port.right]:
            found_port = match_port(sub_port, name, device)
            if found_port:
                return found_port
        return False
    if name in port.name and device in port.device:
        return port
    return False


# Helper function to find port by name and device
def find_port(ports, name, device):
    print(f'searching for "{name}" in "{device}"')
    for port in ports:
        found_port = match_port(port, name, device)
        if found_port:
            print("  Found")
            return found_port
    print('  Not Found.')
    return None

def connect(a, b):
    if a and b:
        a.connect(b)
        print('Connected.')
    else:
        print('Failed to connect.')

# Connect MDA Piano to Scarlett 4i4 4th Gen Analog Stereo
mda_piano_left = find_port(outputs, "left_out", "MDA Piano")
mda_piano_right = find_port(outputs, "right_out", "MDA Piano")
scarlett_left = find_port(inputs, "playback_FL", "Focusrite")
scarlett_right = find_port(inputs, "playback_FR", "Focusrite")

connect(mda_piano_left, scarlett_left)
connect(mda_piano_right, scarlett_right)

# Connect Midi-Bridge to MDA Piano
midi_bridge_out = find_port(outputs, "Port-0", "Midi-Bridge")
mda_piano_in = find_port(inputs, "event_in", "MDA Piano")

connect(midi_bridge_out, mda_piano_in)

# Connect Midi-Bridge to Scarlett 4i4 4th Gen MIDI
midi_bridge_out = find_port(outputs, "Port-0", "Midi-Bridge")
scarlett_midi_in = find_port(inputs, "Scarlett 4i4 4th Gen MIDI", "Midi-Bridge")

connect(midi_bridge_out, scarlett_midi_in)

exit(0)
