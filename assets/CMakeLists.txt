## Assets Target Configuration ##

set(SRB2_ASSET_DIRECTORY "${CMAKE_SOURCE_DIR}/game-assets"
	CACHE STRING "Path to directory that contains all asset files for the installer."
)

set(SRB2_ASSET_HASHED
"srb2.srb\;gfx.kart\;textures.kart\;chars.kart\;maps.kart"
	CACHE STRING "Asset filenames to apply MD5 checks. No spaces between entries!" FORCE
)

set(SRB2_ASSET_DOCS
"README.txt\;HISTORY.txt\;LICENSE.txt\;LICENSE-3RD-PARTY.txt"
	CACHE STRING "Documentation filenames. No spaces between entries!" FORCE
)

foreach(SRB2_ASSET srb2.srb gfx.kart textures.kart chars.kart maps.kart)
	set(SRB2_ASSET_HASH_VAR "SRB2_ASSET_${SRB2_ASSET}_HASH")
	file(MD5 "${SRB2_ASSET_DIRECTORY}/${SRB2_ASSET}" "${SRB2_ASSET_HASH_VAR}")
	set(${SRB2_ASSET_HASH_VAR} "${${SRB2_ASSET_HASH_VAR}}" CACHE INTERNAL "Generated MD5 for ${SRB2_ASSET}" FORCE)
endforeach()

if(${CMAKE_SYSTEM} MATCHES Darwin)
	get_target_property(outname SRB2SDL2 OUTPUT_NAME)
	install(DIRECTORY "${SRB2_ASSET_DIRECTORY}/"
		DESTINATION "${outname}.app/Contents/Resources"
	)
	install(FILES ${SRB2_ASSET_DOCS}
		DESTINATION .
		OPTIONAL
	)
else()
	install(DIRECTORY "${SRB2_ASSET_DIRECTORY}/"
		DESTINATION .
	)
endif()
