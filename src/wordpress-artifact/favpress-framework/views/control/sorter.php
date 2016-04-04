<?php if(!$is_compact) echo FavPress_View::instance()->load('control/template_control_head', $head_info); ?>

<select multiple name="<?php echo $name; ?>" class="favpress-input favpress-js-sorter" data-favpress-opt="<?php echo $opt; ?>">
	<?php
	$labels = array();
	foreach ($items as $item) $labels[$item->value] = $item->label;
	?>

	<?php foreach ($value as $v): ?>
	<option selected value="<?php echo $v; ?>"><?php echo $labels[$v]; ?></option>
	<?php unset($labels[$v]); endforeach; ?>

	<?php foreach ($labels as $i => $label): ?>
	<option value="<?php echo $i; ?>"><?php echo $label; ?></option>
	<?php endforeach; ?>
</select>

<?php if(!$is_compact) echo FavPress_View::instance()->load('control/template_control_foot', $head_info); ?>