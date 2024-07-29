#!/bin/bash

config_file="pipewire_config.json"

# Read the JSON file and create links
jq -c '.links[]' "$config_file" | while read link; do
	output_node=$(echo $link | jq -r '.output_node')
	output_port=$(echo $link | jq -r '.output_port')
	input_node=$(echo $link | jq -r '.input_node')
	input_port=$(echo $link | jq -r '.input_port')

	pw-cli create-link "$output_node" "$output_port" "$input_node" "$input_port"
done
